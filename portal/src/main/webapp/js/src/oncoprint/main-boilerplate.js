// boilerplate for the main portal page
//
// Gideon Dresdner July 2013
requirejs(  [         'Oncoprint',    'OncoprintUtils'],
            function(   Oncoprint,      utils) {

    // This is for the moustache-like templates
    // prevents collisions with JSP tags
    _.templateSettings = {
        interpolate : /\{\{(.+?)\}\}/g
    };

    // add in controls from template
    document.getElementById('oncoprint_controls').innerHTML
        = _.template(document.getElementById('main-controls-template').innerHTML)();

    var clinicalAttributes = new ClinicalAttributesColl();

    var $zoom_el = $('#oncoprint_controls #zoom');
    var $new_zoom_el = $('#oncoprint_whole_body .oncoprint-diagram-toolbar-buttons');
    var zoom;
    var totalAttrs=[];
    var recordAttrs;//make a record of all attrs
    
    var gapSpaceGeneClinic = 10;// Gap between gene data and clinic 
    
    // basically a hack to prevent the zoom function from a particular oncoprint
    // from getting bound to the UI slider forever
    var reset_zoom = function() {
        $zoom_el.empty();
        zoom = utils.zoomSetup($new_zoom_el, oncoprint.zoom);
        
        $('#oncoprint_zoom_slider').hover(
        function () {
        $(this).css('fill', '#0000FF');
        $(this).css('font-size', '18px');
        $(this).css('cursor', 'pointer');
        },
        function () {
        $(this).css('fill', '#87CEFA');
        $(this).css('font-size', '12px');
        });
        $('#oncoprint_zoom_slider').qtip({
            content: {text: 'move the slider to zoom in and out oncoprint'},
            position: {my:'left bottom', at:'top middle', viewport: $(window)},
            style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightwhite' },
            show: {event: "mouseover"},
            hide: {fixed: true, delay: 100, event: "mouseout"}
        });

        return zoom;
    };

    clinicalAttributes.fetch({
        type: 'POST',
        data: { cancer_study_id: cancer_study_id_selected,
            case_list: window.PortalGlobals.getCases() },
        success: function(attrs) {
            totalAttrs = attrs.toJSON();
            if(window.PortalGlobals.getMutationProfileId()!==null){
                var tem={attr_id: "mutations", datatype: "NUMBER",description: "Number of mutation", display_name: "Mutations"};
                totalAttrs.unshift(tem);
            }
            
            if(window.PortalGlobals.getCancerStudyId()!==null){
                var tem={attr_id: "FRACTION_GENOME_ALTERED", datatype: "NUMBER",description: "Fraction Genome Altered", display_name: "Fraction Genome Altered"};
                totalAttrs.unshift(tem);
            }
            
            recordAttrs=totalAttrs.slice(0);// record the original total attributes
            utils.populate_clinical_attr_select(document.getElementById('select_clinical_attributes'), totalAttrs);
            $(select_clinical_attributes_id).chosen({width: "240px", "font-size": "12px", search_contains: true});
        }
    });

    var oncoprint;
    
    var extraTracks=[]; // used to record clinical attributes added
    var extraGenes=[]; // used to record genes add customized
    var extraAttributes=[]; // used to record attributes names add customized
    var sortStatus=[];
    var cases = window.PortalGlobals.getCases();
    var genes = window.PortalGlobals.getGeneListString().split(" ");

    var outer_loader_img = $('#oncoprint #outer_loader_img');
    var inner_loader_img = $('#oncoprint #inner_loader_img');

    var geneDataColl = new GeneDataColl();
    geneDataColl.fetch({
        type: "POST",
        data: {
            cancer_study_id: cancer_study_id_selected,
            oql: $('#gene_list').val(),
            case_list: cases,
            geneticProfileIds: window.PortalGlobals.getGeneticProfiles(),
            z_score_threshold: window.PortalGlobals.getZscoreThreshold(),
            rppa_score_threshold: window.PortalGlobals.getRppaScoreThreshold()
        },
        success: function(data) {
            oncoprint = Oncoprint(document.getElementById('oncoprint_body'), {
                geneData: data.toJSON(),
                genes: genes,
                legend: document.getElementById('oncoprint_legend')
            },extraTracks);
            outer_loader_img.hide();
            $('#oncoprint #everything').show();

            oncoprint.sortBy(sortBy.val(), cases.split(" "));

            $('.attribute_name').qtip({
                content: {text: 'Click to drag '},
                position: {my:'left bottom', at:'top middle', viewport: $(window)},
                style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightyellow' },
                show: {event: "mouseover"},
                hide: {fixed: true, delay: 100, event: "mouseout"}
            });
                    

            zoom = reset_zoom();
        }
    });

    var select_clinical_attributes_id = '#select_clinical_attributes';
    var oncoprintClinicals;
    var sortBy = $('#oncoprint_controls #sort_by');
    $('#oncoprint_controls #sort_by').chosen({width: "240px", disable_search: true });

    // params: bool
    // enable or disable all the various oncoprint controls
    // true -> enable
    // false -> disable
    var toggleControls = function(bool) {
        var whitespace = $('#toggle_whitespace');
        var unaltered = $('#toggle_unaltered_cases');
        var select_clinical_attributes =  $(select_clinical_attributes_id);

        var enable_disable = !bool;

        whitespace.attr('disabled', enable_disable);
        unaltered.attr('disabled', enable_disable);
        select_clinical_attributes.prop('disabled', enable_disable).trigger("liszt:updated");
        zoom.attr('disabled', enable_disable);
        sortBy.prop('disabled', enable_disable).trigger("liszt:updated");
    };
    
    var selectedTitle;
    var functionFunctions = function()
    {
        $('.special_delete').click(function() {
            var attr = $(this).attr("alt");
            var indexNum = extraTracks.indexOf(attr);
            var sampleNumbers = extraGenes.length/extraAttributes.length;
            extraTracks.splice(indexNum, 1);
            extraGenes.splice(indexNum, sampleNumbers);
            extraAttributes.splice(indexNum, 1);
            sortStatus.splice(indexNum, 1);
            removeClinicalAttribute();
        });// enable delete symbol "x" function

        //tooltip for the track deletion function
        $('.special_delete').qtip({
                    content: {text: 'click here to delete this track!'},
                    position: {my:'left bottom', at:'top right', viewport: $(window)},
                    style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightyellow' },
                    show: {event: "mouseover"},
                    hide: {fixed: true, delay: 100, event: "mouseout"}
                    });
        $('.special_delete').hover(
                    function () {
                    $(this).css('fill', '#0000FF');
                    $(this).css('font-size', '18px');
                    $(this).css('cursor', 'pointer');
                    },
                    function () {
                    $(this).css('fill', '#87CEFA');
                    $(this).css('font-size', '12px');
                    });
                    
        $('.attribute_name').qtip({
                content: {text: 'Click to drag '},
                position: {my:'left bottom', at:'top middle', viewport: $(window)},
                style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightyellow' },
                show: {event: "mouseover"},
                hide: {fixed: true, delay: 100, event: "mouseout"}
            });
            
        $(".oncoprint_Sort_Button").qtip({
                content: {text: 'Click to sort '},
                position: {my:'left bottom', at:'top middle', viewport: $(window)},
                style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightyellow' },
                show: {event: "mouseover"},
                hide: {fixed: true, delay: 100, event: "mouseout"}
            });
        $('.oncoprint_Sort_Button').hover(
            function () {
            $(this).css('fill', '#0000FF');
            $(this).css('font-size', '18px');
            $(this).css('cursor', 'pointer');
            },
            function () {
            $(this).css('fill', '#87CEFA');
            $(this).css('font-size', '12px');
            });
        
        $('.oncoprint_Sort_Button').click(function() {
            
            var sortButtonYValue = $(this)[0].attributes.y.value;
            var indexSortButton=parseInt(sortButtonYValue/29);
            if($(this)[0].attributes.href.value==="images/increaseSort.svg")
            {
                sortStatus[indexSortButton] = 'nonSort';
            }
            else if($(this)[0].attributes.href.value==="images/nonSort.svg")
            {
                sortStatus[indexSortButton] ='increSort';
            }
            
            oncoprint.remove_oncoprint();
            inner_loader_img.show();
            toggleControls(false); //disable toggleControls

            inner_loader_img.hide();

            oncoprint = Oncoprint(document.getElementById('oncoprint_body'), {
                geneData: geneDataColl.toJSON(),
                clinicalData: extraGenes,
                genes: genes,
                clinical_attrs: extraAttributes,
                legend: document.getElementById('oncoprint_legend'),
                sortStatus:sortStatus
            },extraTracks);

            oncoprint.sortBy(sortBy.val(), cases.split(" "));
            functionFunctions();
            toggleControls(true);
        });
        
        $('.attribute_name').click(
                    function() {
                    selectedTitle =$(this);
                    $(this).attr('fill', 'red');
                    }); 
    }

    //delete clinicalAttribute added before
    var removeClinicalAttribute = function()
    {
        oncoprint.remove_oncoprint();
        inner_loader_img.show();
        toggleControls(false); //disable toggleControls

        inner_loader_img.hide();
        
        oncoprint = Oncoprint(document.getElementById('oncoprint_body'), {
            geneData: geneDataColl.toJSON(),
            clinicalData: extraGenes,
            genes: genes,
            clinical_attrs: extraAttributes,
            legend: document.getElementById('oncoprint_legend'),
            sortStatus:sortStatus
        },extraTracks);

        oncoprint.sortBy(sortBy.val(), cases.split(" "));
        
        totalAttrs = recordAttrs.slice(0);

        for(attributeElemValue in extraAttributes)
        {
            var attributeElemValueIndex;
            
            for(m in totalAttrs) 
            {
                if(totalAttrs[m].display_name === extraAttributes[attributeElemValue].display_name)
                {
                    attributeElemValueIndex=m; 
                    totalAttrs.splice(attributeElemValueIndex,1);
                }
            }  
        }
        
        utils.populate_clinical_attr_select(document.getElementById('select_clinical_attributes'), totalAttrs);
        
        
        functionFunctions();
                    
        if(extraAttributes.length>1)
        {
            $('.oncoprint-diagram-top').css("display","inline");
        }
        else
        {
            $('.oncoprint-diagram-top').css("display","none");
            if(extraAttributes.length<1)
            {
                $('.select_clinical_attributes_from').attr("data-placeholder","Add a clinical attribute track");
            }
        }
        oncoprint.sortBy(sortBy.val(), cases.split(" "));
        
        toggleControls(true);
//        // disable the option to sort by clinical data
//        $(sortBy.add('option[value="clinical"]')[1]).prop('disabled', true);
    }

    var refreshOncoPrint = function(){
        oncoprint.remove_oncoprint();
        inner_loader_img.show();
        toggleControls(false); //disable toggleControls

        inner_loader_img.hide();
        
        oncoprint = Oncoprint(document.getElementById('oncoprint_body'), {
            geneData: geneDataColl.toJSON(),
            clinicalData: extraGenes,
            genes: genes,
            clinical_attrs: extraAttributes,
            legend: document.getElementById('oncoprint_legend'),
            sortStatus:sortStatus
        },extraTracks);

        functionFunctions();
        oncoprint.sortBy(sortBy.val(), cases.split(" "));      
        toggleControls(true);
    }

    // handler for when user selects a clinical attribute to visualization
    var clinicalAttributeSelected = function() {
        oncoprint.remove_oncoprint();
        inner_loader_img.show();
        toggleControls(false);

        var clinicalAttribute = $(select_clinical_attributes_id + ' option:selected')[0].__data__;

        if (clinicalAttribute.attr_id === undefined) {      // selected "none"
            inner_loader_img.hide();

            oncoprint = Oncoprint(document.getElementById('oncoprint_body'), {
                geneData: geneDataColl.toJSON(),
                genes: genes,
                legend: document.getElementById('oncoprint_legend')
            },extraTracks);

            oncoprint.sortBy(sortBy.val(), cases.split(" "));

            // disable the option to sort by clinical data
            $(sortBy.add('option[value="clinical"]')[1]).prop('disabled', true);
        } else {
            
            $('.select_clinical_attributes_from').attr("data-placeholder","Add another clinical attribute track");
            
            if(clinicalAttribute.attr_id === "mutations")
            {
                    oncoprintClinicals = new ClinicalMutationColl();
                    oncoprintClinicals.fetch({
                    type: "POST",

                    data: {
                            mutation_profile: window.PortalGlobals.getMutationProfileId(),
                            cmd: "count_mutations",
                            case_ids: cases
                    },
                    success: function(response) {
                        inner_loader_img.hide();
                        
                        extraTracks = extraTracks.concat(response.attributes().map(function(attr) { return attr.attr_id; }));
                        extraGenes = extraGenes.concat(response.toJSON());
                        extraAttributes=extraAttributes.concat(response.attributes());
                        sortStatus = sortStatus.concat('increSort');
                        oncoprint = Oncoprint(document.getElementById('oncoprint_body'), {
                            geneData: geneDataColl.toJSON(),
                            clinicalData: extraGenes,
                            genes: genes,
                            clinical_attrs: extraAttributes,
                            legend: document.getElementById('oncoprint_legend'),
                            sortStatus:sortStatus
                        },extraTracks);
                             
                        oncoprint.sortBy(sortBy.val(), cases.split(" "));

                        // enable the option to sort by clinical data
                        $(sortBy.add('option[value="clinical"]')[1]).prop('disabled', false);

//                        // sort by genes by default
//                        sortBy.val('genes');
                        for(attributeElemValue in extraAttributes)
                        {
                            var attributeElemValueIndex;
                            
                            for(m in totalAttrs) 
                            {
                                if(totalAttrs[m].display_name === extraAttributes[attributeElemValue].display_name)
                                {
                                    attributeElemValueIndex=m; 
                                    totalAttrs.splice(attributeElemValueIndex,1);
                                }
                            }  
                        }

                        utils.populate_clinical_attr_select(document.getElementById('select_clinical_attributes'), totalAttrs);
                        
                        toggleControls(true);
                        
                        functionFunctions();
                        
//                        zoom = reset_zoom();

                        // sync
                        oncoprint.zoom(zoom.slider("value"));
                        oncoprint.showUnalteredCases(!$('#toggle_unaltered_cases').is(":checked"));
                        oncoprint.toggleWhiteSpace(!$('#toggle_whitespace').is(":checked"));
                        utils.make_mouseover(d3.selectAll('.sample rect'),{linkage:true});        // hack =(

                    }
                });
            }
            else if(clinicalAttribute.attr_id === "FRACTION_GENOME_ALTERED")
            {
                    oncoprintClinicals = new ClinicalCNAColl();
                    oncoprintClinicals.fetch({
                    type: "POST",

                    data: {
                            cancer_study_id:window.PortalGlobals.getCancerStudyId(),
                            cmd: "get_cna_fraction",
                            case_ids: cases
                    },
                    success: function(response) {
                        inner_loader_img.hide();
                        
                        extraTracks = extraTracks.concat(response.attributes().map(function(attr) { return attr.attr_id; }));
                        extraGenes = extraGenes.concat(response.toJSON());
                        extraAttributes=extraAttributes.concat(response.attributes());
                        sortStatus = sortStatus.concat('increSort');
                        oncoprint = Oncoprint(document.getElementById('oncoprint_body'), {
                            geneData: geneDataColl.toJSON(),
                            clinicalData: extraGenes,
                            genes: genes,
                            clinical_attrs: extraAttributes,
                            legend: document.getElementById('oncoprint_legend'),
                            sortStatus:sortStatus
                        },extraTracks);
                             
                        oncoprint.sortBy(sortBy.val(), cases.split(" "));

                        // enable the option to sort by clinical data
                        $(sortBy.add('option[value="clinical"]')[1]).prop('disabled', false);

//                        // sort by genes by default
//                        sortBy.val('genes');
                        for(attributeElemValue in extraAttributes)
                        {
                            var attributeElemValueIndex;
                            
                            for(m in totalAttrs) 
                            {
                                if(totalAttrs[m].display_name === extraAttributes[attributeElemValue].display_name)
                                {
                                    attributeElemValueIndex=m; 
                                    totalAttrs.splice(attributeElemValueIndex,1);
                                }
                            }  
                        }

                        utils.populate_clinical_attr_select(document.getElementById('select_clinical_attributes'), totalAttrs);
                        
                        toggleControls(true);
                        
                        functionFunctions();
                        
//                        zoom = reset_zoom();

                        // sync
                        oncoprint.zoom(zoom.slider("value"));
                        oncoprint.showUnalteredCases(!$('#toggle_unaltered_cases').is(":checked"));
                        oncoprint.toggleWhiteSpace(!$('#toggle_whitespace').is(":checked"));
                        utils.make_mouseover(d3.selectAll('.sample rect'),{linkage:true});        // hack =(
                    }
                });
            }
            else
            {
                oncoprintClinicals = new ClinicalColl();
                    oncoprintClinicals.fetch({
                    type: "POST",

                    data: {
                        cancer_study_id: cancer_study_id_selected,
                        attribute_id: clinicalAttribute.attr_id,
                        case_list: cases
                    },
                    success: function(response) {
                        inner_loader_img.hide();
                        
                        extraTracks = extraTracks.concat(response.attributes().map(function(attr) { return attr.attr_id; }));
                        extraGenes = extraGenes.concat(response.toJSON());
                        extraAttributes=extraAttributes.concat(response.attributes());
                        sortStatus = sortStatus.concat('increSort');
                        oncoprint = Oncoprint(document.getElementById('oncoprint_body'), {
                            geneData: geneDataColl.toJSON(),
                            clinicalData: extraGenes,
                            genes: genes,
                            clinical_attrs: extraAttributes,
                            legend: document.getElementById('oncoprint_legend'),
                            sortStatus:sortStatus
                        },extraTracks);

                        oncoprint.sortBy(sortBy.val(), cases.split(" "));

                        // enable the option to sort by clinical data
                        $(sortBy.add('option[value="clinical"]')[1]).prop('disabled', false);

//                        // sort by genes by default
//                        sortBy.val('genes');

                        for(attributeElemValue in extraAttributes)
                        {
                            var attributeElemValueIndex;
                            
                            for(m in totalAttrs) 
                            {
                                if(totalAttrs[m].display_name === extraAttributes[attributeElemValue].display_name)
                                {
                                    attributeElemValueIndex=m; 
                                    totalAttrs.splice(attributeElemValueIndex,1);
                                }
                            }
                            
                        }

                        utils.populate_clinical_attr_select(document.getElementById('select_clinical_attributes'), totalAttrs);
                        
                        toggleControls(true);

                        functionFunctions();
                        
//                        zoom = reset_zoom();

                        // sync
                        oncoprint.zoom(zoom.slider("value"));
                        oncoprint.showUnalteredCases(!$('#toggle_unaltered_cases').is(":checked"));
                        oncoprint.toggleWhiteSpace(!$('#toggle_whitespace').is(":checked"));
                        utils.make_mouseover(d3.selectAll('.sample rect'),{linkage:true});        // hack =(

                    }
                });
            }
//            alert(extraAttributes.length);
            if(extraAttributes.length>0)
            {
                $('.oncoprint-diagram-top').css("display","inline");
            }
        }
    };
    
    $(select_clinical_attributes_id).change(clinicalAttributeSelected);
     
    //delete clinicalAttribute added before
    var shiftGeneData = function()
    {
        oncoprint.remove_oncoprint();
        inner_loader_img.show();
        toggleControls(false); //disable toggleControls

        inner_loader_img.hide();
        var firstGene = genes[0];
        genes.splice(0,1);
        genes.push(firstGene);
        oncoprint = Oncoprint(document.getElementById('oncoprint_body'), {
            geneData: geneDataColl.toJSON(),
            clinicalData: extraGenes,
            genes: genes,
            clinical_attrs: extraAttributes,
            legend: document.getElementById('oncoprint_legend')
        },extraTracks);

        oncoprint.sortBy(sortBy.val(), cases.split(" "));
        toggleControls(true);
        $('.special_delete').click(function() {
            var attr = $(this).attr("alt");
            var indexNum = extraTracks.indexOf(attr);
            extraTracks.splice(indexNum, 1);
            extraGenes.splice(indexNum, 1);
            extraAttributes.splice(indexNum, 1);
            removeClinicalAttribute();
        });// enable delete symbol "x" function
        //
        //tooltip for the track deletion function
        $('.special_delete').qtip({
                    content: {text: 'click here to delete this track!'},
                    position: {my:'left bottom', at:'top right', viewport: $(window)},
                    style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightyellow' },
                    show: {event: "mouseover"},
                    hide: {fixed: true, delay: 100, event: "mouseout"}
                    });
        $('.special_delete').hover(
                    function () {
                    $(this).css('fill', '#0000FF');
                    $(this).css('font-size', '18px');
                    $(this).css('cursor', 'pointer');
                    },
                    function () {
                    $(this).css('fill', '#87CEFA');
                    $(this).css('font-size', '12px');
                    });
                    
        $(".oncoprint_Sort_Button").qtip({
                content: {text: 'Click to sort '},
                position: {my:'left bottom', at:'top middle', viewport: $(window)},
                style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightyellow' },
                show: {event: "mouseover"},
                hide: {fixed: true, delay: 100, event: "mouseout"}
            });
        $('.oncoprint_Sort_Button').hover(
            function () {
            $(this).css('fill', '#0000FF');
            $(this).css('font-size', '18px');
            $(this).css('cursor', 'pointer');
            },
            function () {
            $(this).css('fill', '#87CEFA');
            $(this).css('font-size', '12px');
            });
        $('.oncoprint_Sort_Button').click(function() {
            if($(this)[0].attributes.href.value==="images/nonSort.svg")
            {
                $(this)[0].attributes.href.value="images/increaseSort.svg";
            }
            else if($(this)[0].attributes.href.value==="images/increaseSort.svg")
            {
               $(this)[0].attributes.href.value="images/decreaseSort.svg"; 
            }
            else if($(this)[0].attributes.href.value==="images/decreaseSort.svg")
            {
                $(this)[0].attributes.href.value="images/nonSort.svg";
            }
        });
    }
    
    //delete clinicalAttribute added before
    var shiftClinicData = function()
    {
        oncoprint.remove_oncoprint();
        inner_loader_img.show();
        toggleControls(false); //disable toggleControls

        inner_loader_img.hide();
        var sizeOfSamples = extraGenes.length/extraAttributes.length;//calculate length of samples
        //shift clinical attrs samples
        var firstClinic = extraGenes.slice(0,sizeOfSamples);
        extraGenes.slice(0,sizeOfSamples)
        extraGenes.concat(firstClinic);
        //shift clinical attrs names
        var firstClinicAttribute = extraTracks[0];
        extraTracks.splice(0,1);
        extraTracks.push(firstClinicAttribute);
        
        var firstClinicAttrs = extraAttributes[0];
        extraAttributes.splice(0,1);
        extraAttributes.push(firstClinicAttrs);
        
        oncoprint = Oncoprint(document.getElementById('oncoprint_body'), {
            geneData: geneDataColl.toJSON(),
            clinicalData: extraGenes,
            genes: genes,
            clinical_attrs: extraAttributes,
            legend: document.getElementById('oncoprint_legend')
        },extraTracks);

        oncoprint.sortBy(sortBy.val(), cases.split(" "));
        toggleControls(true);
        $('.special_delete').click(function() {
            var attr = $(this).attr("alt");
            var indexNum = extraTracks.indexOf(attr);
            extraTracks.splice(indexNum, 1);
            extraGenes.splice(indexNum, 1);
            extraAttributes.splice(indexNum, 1);
            removeClinicalAttribute();
        });// enable delete symbol "x" function
        //
        //tooltip for the track deletion function
        $('.special_delete').qtip({
                    content: {text: 'click here to delete this track!'},
                    position: {my:'left bottom', at:'top right', viewport: $(window)},
                    style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightyellow' },
                    show: {event: "mouseover"},
                    hide: {fixed: true, delay: 100, event: "mouseout"}
                    });
        $('.special_delete').hover(
                    function () {
                    $(this).css('fill', '#0000FF');
                    $(this).css('font-size', '18px');
                    $(this).css('cursor', 'pointer');
                    },
                    function () {
                    $(this).css('fill', '#87CEFA');
                    $(this).css('font-size', '12px');
                    });
                    
        $(".oncoprint_Sort_Button").qtip({
                content: {text: 'Click to sort '},
                position: {my:'left bottom', at:'top middle', viewport: $(window)},
                style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightyellow' },
                show: {event: "mouseover"},
                hide: {fixed: true, delay: 100, event: "mouseout"}
            });
        $('.oncoprint_Sort_Button').hover(
            function () {
            $(this).css('fill', '#0000FF');
            $(this).css('font-size', '18px');
            $(this).css('cursor', 'pointer');
            },
            function () {
            $(this).css('fill', '#87CEFA');
            $(this).css('font-size', '12px');
            });  
        $('.oncoprint_Sort_Button').click(function() {
            if($(this)[0].attributes.href.value==="images/nonSort.svg")
            {
                $(this)[0].attributes.href.value="images/increaseSort.svg";
            }
            else if($(this)[0].attributes.href.value==="images/increaseSort.svg")
            {
               $(this)[0].attributes.href.value="images/decreaseSort.svg"; 
            }
            else if($(this)[0].attributes.href.value==="images/decreaseSort.svg")
            {
                $(this)[0].attributes.href.value="images/nonSort.svg";
            }
        });
    }
    
    var _startX = 0;            // mouse starting positions
    var _startY = 0;
    var _endX=0;                // mouse ending positions
    var _endY=0;
    var _offsetX = 0;           // current element offset
    var _offsetY = 0;
    var _dragElement;           // needs to be passed from OnMouseDown to OnMouseMove
    var _dragElementIndex;      //index of the selected title
    var spaceHeight = 0;
    var selectedNotMutation= false;
    
    function ExtractNumber(value)
    {
        var n = parseInt(value);

        return n == null || isNaN(n) ? 0 : n;
    }
    
    function calculateGeneMovement(yMovement)
    {
        var tem = genes[yMovement];
        genes[yMovement] = genes[_dragElementIndex];
        genes[_dragElementIndex]=tem;
        refreshOncoPrint();
    }
    
    function calculateClinicMovement(yMovement)
    {
        var sizeOfSamples = extraGenes.length/extraAttributes.length;//calculate length of samples

        //shift clinical attrs samples
        for(var i=0; i<sizeOfSamples; i++)
        {
            var temClinic = extraGenes[yMovement*sizeOfSamples+i];
            extraGenes[yMovement*sizeOfSamples+i]=extraGenes[_dragElementIndex*sizeOfSamples+i];
            extraGenes[_dragElementIndex*sizeOfSamples+i] = temClinic;
        }
        
        //shift clinical attrs names
        var tempClinicAttribute = extraTracks[yMovement];
        extraTracks[yMovement]=extraTracks[_dragElementIndex];
        extraTracks[_dragElementIndex] = tempClinicAttribute;
        
        var tempClinicAttrs = extraAttributes[yMovement];
        extraAttributes[yMovement]=extraAttributes[_dragElementIndex];
        extraAttributes[_dragElementIndex] = tempClinicAttrs;
        
        var tempSortStatus = sortStatus[yMovement];
        sortStatus[yMovement]=sortStatus[_dragElementIndex];
        sortStatus[_dragElementIndex] = tempSortStatus;
        
        refreshOncoPrint();
    }
                
    function OnMouseDown(e)
    {
        // IE is retarded and doesn't pass the event object
        if (e == null) 
            e = window.event; 
        
        // grab the mouse position
        _startX = e.clientX;
        _startY = e.clientY;

        // IE uses srcElement, others use target
        var target = e.target != null ? e.target : e.srcElement;
        
        //alert('mouse position is:X '+_startX+'Y '+_startY);
        //
        // for IE, left click == 1
        // for Firefox, left click == 0
        if ((e.button == 1 && window.event != null || e.button == 0)&& target.className.animVal==="attribute_name")
        {        
            target.attributes.fill.value = "red";
            
            // grab the clicked element's position
            _offsetX = ExtractNumber(target.parentElement.attributes.x.value);
            _offsetY = ExtractNumber(target.parentElement.attributes.y.value);
            
//            selectedNotMutation = false;
//            _dragElementIndex=undefined;
            
            for(m in genes) 
            {
                if(genes[m] === target.textContent)
                {
                    _dragElementIndex = parseInt(m); 
                    break;
                }
            }
            
            if(_dragElementIndex === undefined)
            {
                selectedNotMutation = true;
                for(n in extraAttributes)
                {
                    if(extraAttributes[n].display_name === target.textContent)
                    {
                        _dragElementIndex = parseInt(n);
                        break;
                    }
                }
            }
            
            spaceHeight=(ExtractNumber(target.parentElement.parentElement.children[2].attributes.y.value)-ExtractNumber(target.parentElement.parentElement.children[0].attributes.y.value))/2; //get the height of each table row

            // bring the clicked element to the front while it is being dragged
            _oldZIndex = target.style.zIndex;
            target.style.zIndex = 10000;

            // we need to access the element in OnMouseMove
            _dragElement = target;

            // tell our code to start moving the element with the mouse
            document.onmousemove = OnMouseMove;

            // cancel out any text selections
            document.body.focus();

            // prevent text selection in IE
            document.onselectstart = function () { return false; };
            // prevent IE from trying to drag an image
            target.ondragstart = function() { return false; };

            // prevent text selection (except IE)
            return false;
        }
    }
    
    function OnMouseUp(e)
    {
        $('.attribute_name').attr('fill','black');
        
        var yPosition=_offsetY + e.clientY - _startY;
        
        if(selectedNotMutation)
        {
            if(yPosition > (extraAttributes.length*spaceHeight - 7))
            {
                yPosition = extraAttributes.length*spaceHeight - 7;
            }
            else if(yPosition<10)
            {
                yPosition = 10;
            }
        }
        else
        {
            
            if(extraAttributes.length>0)
            {
                if(yPosition > (extraAttributes.length*spaceHeight - gapSpaceGeneClinic + genes.length*spaceHeight - 7))
                {
                    yPosition = extraAttributes.length*spaceHeight - gapSpaceGeneClinic + genes.length*spaceHeight - 7;
                }
                else if(yPosition<(extraAttributes.length*spaceHeight - gapSpaceGeneClinic +10))
                {
                    yPosition = extraAttributes.length*spaceHeight - gapSpaceGeneClinic + 10;
                }
            }
            else
            {
                if(yPosition > (extraAttributes.length*spaceHeight + genes.length*spaceHeight - 7))
                {
                    yPosition = extraAttributes.length*spaceHeight + genes.length*spaceHeight - 7;
                }
                else if(yPosition<(extraAttributes.length*spaceHeight+10))
                {
                    yPosition = extraAttributes.length*spaceHeight + 10;
                }
            }
            
            
//            if(yPosition > (extraAttributes.length*spaceHeight + genes.length*spaceHeight - 7))
//            {
//                yPosition = extraAttributes.length*spaceHeight + genes.length*spaceHeight - 7;
//            }
//            else if(yPosition<(extraAttributes.length*spaceHeight+10))
//            {
//                yPosition = extraAttributes.length*spaceHeight + 10;
//            }
        }
        
        var indexValue;
        
        if(selectedNotMutation)
        {
           indexValue = parseInt(yPosition/spaceHeight); 
        }
        else
        {
            if(extraAttributes.length>0)
            {
                indexValue = parseInt((yPosition-extraAttributes.length * spaceHeight - gapSpaceGeneClinic)/spaceHeight);
            }
            else
            {
                indexValue = parseInt((yPosition-extraAttributes.length * spaceHeight)/spaceHeight);
            }
        }
        
        if(indexValue != _dragElementIndex && !isNaN(indexValue))
        {
            if(selectedNotMutation)
            {
                calculateClinicMovement(indexValue);
            }
            else
            {
                calculateGeneMovement(indexValue);
            }
        }
        else
        {
            if(_dragElement!=undefined)
            {
                _dragElement.parentElement.attributes.y.value=_offsetY.toString();
            }
        }

        if (_dragElement != null)
        {
            _dragElement.style.zIndex = _oldZIndex;

            // we're done with these events until the next OnMouseDown
            document.onmousemove = null;
            document.onselectstart = null;
            _dragElement.ondragstart = null;

            // this is how we know we're not dragging      
            _dragElement = null;
            
            _startX = 0;            // mouse starting positions
            _startY = 0;
            _endX=0;                // mouse ending positions
            _endY=0;
            _offsetX = 0;           // current element offset
            _offsetY = 0;
            _dragElement=undefined;           // needs to be passed from OnMouseDown to OnMouseMove
            _dragElementIndex=undefined;      //index of the selected title
            spaceHeight = 0;
            selectedNotMutation= false;
        }
    }
    
    function OnMouseMove(e)
    {
        if (e == null) 
            var e = window.event; 

        // this is the actual "drag code"
        var yPosition=_offsetY + e.clientY - _startY;
        
        if(selectedNotMutation)
        {
            if(yPosition > (extraAttributes.length*spaceHeight - 7))
            {
                yPosition = extraAttributes.length*spaceHeight - 7;
            }
            else if(yPosition<10)
            {
                yPosition = 10;
            }
        }
        else
        {
            if(extraAttributes.length>0)
            {
                if(yPosition > (extraAttributes.length*spaceHeight - gapSpaceGeneClinic + genes.length*spaceHeight - 7))
                {
                    yPosition = extraAttributes.length*spaceHeight - gapSpaceGeneClinic + genes.length*spaceHeight - 7;
                }
                else if(yPosition<(extraAttributes.length*spaceHeight - gapSpaceGeneClinic +10))
                {
                    yPosition = extraAttributes.length*spaceHeight - gapSpaceGeneClinic + 10;
                }
            }
            else
            {
                if(yPosition > (extraAttributes.length*spaceHeight + genes.length*spaceHeight - 7))
                {
                    yPosition = extraAttributes.length*spaceHeight + genes.length*spaceHeight - 7;
                }
                else if(yPosition<(extraAttributes.length*spaceHeight+10))
                {
                    yPosition = extraAttributes.length*spaceHeight + 10;
                }
            }
            
            console.log(yPosition);
            
//            if(yPosition > (extraAttributes.length*spaceHeight + genes.length*spaceHeight - 7))
//            {
//                yPosition = extraAttributes.length*spaceHeight + genes.length*spaceHeight - 7;
//            }
//            else if(yPosition<(extraAttributes.length*spaceHeight+10))
//            {
//                yPosition = extraAttributes.length*spaceHeight + 10;
//            }
        }
        
        _dragElement.parentElement.attributes.y.value = yPosition.toString(); 
    }

    function InitDragDrop()
    {
        document.onmousedown = OnMouseDown;
        document.onmouseup = OnMouseUp;
    }
    
    $(document).ready(function() {
        // bind away
        $('#oncoprint_controls #sort_by').change(function() {
            oncoprint.sortBy(sortBy.val(), cases.split(" "));
        });
        
        $('#toggle_unaltered_cases').click(function() {
            oncoprint.toggleUnalteredCases();
            utils.make_mouseover(d3.selectAll('.sample rect'),{linkage:true});     // hack =(
//            oncoprint.sortBy(sortBy.val());
        });

        $('#toggle_whitespace').click(function() {
            oncoprint.toggleWhiteSpace();
        });

//        $('.oncoprint-diagram-download').click(function() {
//            var fileType = $(this).attr("type");
//            var params = {
//                filetype: fileType,
//                filename:"oncoprint." + fileType,
//                svgelement: oncoprint.getPdfInput()
//            };
//
//            cbio.util.requestDownload("svgtopdf.do", params);
//        });
//        
//        $('.oncoprint-sample-download').click(function() {
//            var samples = "Sample order in the Oncoprint is: \n";
//            var genesValue = oncoprint.getData();
//            for(var i = 0; i< genesValue.length; i++)
//            {
//                samples= samples + genesValue[i].key+"\n";
//            }
//            var a=document.createElement('a');
//            a.href='data:text/plain;base64,'+btoa(samples);
//            a.textContent='download';
//            a.download='OncoPrintSamples.txt';
//            a.click();
//            //a.delete();
//        });

        
            $('.oncoprint-diagram-removeUCases-icon').click(function(){
              if($(this)[0].attributes.src.value === 'images/removeUCases.svg')
              {
                oncoprint.toggleUnalteredCases();
                utils.make_mouseover(d3.selectAll('.sample rect'),{linkage:true});     // hack =(
                $(this)[0].attributes.src.value = 'images/unremoveUCases.svg';
              }
              else
              {
                oncoprint.toggleUnalteredCases();
                utils.make_mouseover(d3.selectAll('.sample rect'),{linkage:true});     // hack =(
                $(this)[0].attributes.src.value = 'images/removeUCases.svg';
              }
            });
            $('.oncoprint-diagram-removeUCases-icon').hover(
            function () {
            $(this).css('fill', '#0000FF');
            $(this).css('font-size', '18px');
            $(this).css('cursor', 'pointer');
            },
            function () {
            $(this).css('fill', '#87CEFA');
            $(this).css('font-size', '12px');
            });
            $('.oncoprint-diagram-removeUCases-icon').qtip({
            content: {text: 
                        function(){
                        if($(this)[0].attributes.src.value === 'images/removeUCases.svg')
                        {return 'click here to remove unaltered cases!'}
                        else
                        {
                            return 'click here to get unaltered cases back!'
                        }
                    }
                },
            position: {my:'left bottom', at:'top right', viewport: $(window)},
            style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightwhite' },
            show: {event: "mouseover"},
            hide: {fixed: true, delay: 100, event: "mouseout"}
            });


            $('.oncoprint-diagram-removeWhitespace-icon').click(function(){
              if($(this)[0].attributes.src.value === 'images/removeWhitespace.svg')
              {
                  oncoprint.toggleWhiteSpace();
                  $(this)[0].attributes.src.value = 'images/unremoveWhitespace.svg';
              }
              else
              {
                 oncoprint.toggleWhiteSpace();
                 $(this)[0].attributes.src.value = 'images/removeWhitespace.svg'; 
              }
            });
            $('.oncoprint-diagram-removeWhitespace-icon').hover(
            function () {
            $(this).css('fill', '#0000FF');
            $(this).css('font-size', '18px');
            $(this).css('cursor', 'pointer');
            },
            function () {
            $(this).css('fill', '#87CEFA');
            $(this).css('font-size', '12px');
            });
            $('.oncoprint-diagram-removeWhitespace-icon').qtip({
            content: {text: 
                        function(){
                        if($(this)[0].attributes.src.value === 'images/removeWhitespace.svg')
                        {return 'click here to remove whitespace!'}
                        else
                        {
                            return 'click here to get whitespace back!'
                        }
                    }
            },
            position: {my:'left bottom', at:'top right', viewport: $(window)},
            style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightwhite' },
            show: {event: "mouseover"},
            hide: {fixed: true, delay: 100, event: "mouseout"}
            });   
            
            //show or hide legends of oncoprint
            $('.oncoprint-diagram-showlegend-icon').click(function(){
              if($(this)[0].attributes.src.value === 'images/showlegend.svg')
              {
                  $(this)[0].attributes.src.value = 'images/hidelegend.svg';
              }
              else
              {
                 $(this)[0].attributes.src.value = 'images/showlegend.svg'; 
              }
            });
            $('.oncoprint-diagram-showlegend-icon').hover(
            function () {
            $(this).css('fill', '#0000FF');
            $(this).css('font-size', '18px');
            $(this).css('cursor', 'pointer');
            },
            function () {
            $(this).css('fill', '#87CEFA');
            $(this).css('font-size', '12px');
            });
            $('.oncoprint-diagram-showlegend-icon').qtip({
            content: {text: 
                        function(){
                        if($(this)[0].attributes.src.value === 'images/showlegend.svg')
                        {return 'click here to show legends!'}
                        else
                        {
                            return 'click here to hide legends!'
                        }
                    }
            },
            position: {my:'left bottom', at:'top right', viewport: $(window)},
            style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightwhite' },
            show: {event: "mouseover"},
            hide: {fixed: true, delay: 100, event: "mouseout"}
            }); 
            
            
            $('.oncoprint-diagram-downloads-icon').qtip({
            //id: "#oncoprint-diagram-downloads-icon-qtip",
            style: { classes: 'qtip-light qtip-rounded qtip-shadow qtip-lightwhite'  },
            show: {event: "mouseover"},
            hide: {fixed:true, delay: 100, event: "mouseout"},
            position: {my:'top center',at:'bottom center', viewport: $(window)},
            content: {
                text:   "<button class='oncoprint-diagram-download' type='pdf' style='cursor:pointer'>PDF</button>"+
                        "<button class='oncoprint-diagram-download' type='svg' style='cursor:pointer'>SVG</button>"+
                        "<button class='oncoprint-sample-download'  type='txt' style='cursor:pointer'>Samples</button>"
            },

            events:{
                render:function(event){     
                        $('.oncoprint-diagram-download').click(function() {
                        var fileType = $(this).attr("type");
                        var params = {
                            filetype: fileType,
                            filename:"oncoprint." + fileType,
                            svgelement: oncoprint.getPdfInput()
                        };

                        cbio.util.requestDownload("svgtopdf.do", params);
                    });

                    $('.oncoprint-sample-download').click(function() {
                        var samples = "Sample order in the Oncoprint is: \n";
                        var genesValue = oncoprint.getData();
                        for(var i = 0; i< genesValue.length; i++)
                        {
                            samples= samples + genesValue[i].key+"\n";
                        }
                        var a=document.createElement('a');
                        a.href='data:text/plain;base64,'+btoa(samples);
                        a.textContent='download';
                        a.download='OncoPrintSamples.txt';
                        a.click();
                    });
                }
            }
        });
        
        $('.oncoprint-diagram-Shift').click(function() {
            shiftGeneData();
        });
        
        $('.oncoprint-diagram-top').click(function() {
            shiftClinicData();
        });
        
        cbio.util.autoHideOnMouseLeave($("#oncoprint_whole_body"), $(".oncoprint-diagram-toolbar-buttons"));
        
        InitDragDrop();
    });
});
