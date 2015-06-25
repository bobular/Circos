/*
 * The diagram that represents a cluster analysis
 *
 * @class
 */
ClusterAnalysis.Diagram = function( v, species ) {

    // Labels
	switch ( species ) {
		case 'anoph':
			this.species = 'Anopheles';
			break;
		case 'plasmo':
			this.species = 'Plasmodium';
	}

    // Diagram data
    this.circosMatrix = v.circosMatrix;
    this.numOrthologyClusters = v.numOrthologyClusters;
    this.numExpressionClusters = v.numExpressionClusters;
    this.pValuesOfChords = v.pValuesOfChords;
    this.expressionClusters = v.expressionClusters;
    this.orthologyClusters = v.orthologyClusters;
    this.geneToCluster = v.geneToCluster;
    this.ogToCluster = v.ogToCluster;
    this.geneToGroup = v.geneToGroup;

    this.drawDiagram();

};

/*
 * Draw the circos diagram
 */
ClusterAnalysis.Diagram.prototype.drawDiagram = function() {

    // For accessing this in the functions
    var that = this;

    /*
     * Functions for the small buttons
     */

    var onMaximiseClick = function() {

        // Don't run if another diagram is already maximised
        if ( !bigDiagramExists ) {

            bigDiagramExists = true;
            $( '.maximise-button' ).css( 'pointer-events', 'none' );

            // Display the popup container and append svgContainer to diagramContainerBig
            $( '.main-container' ).append( $popupContainer );
            $diagramContainerBig.append( $( this ).parent(), $searchDiv );

            // Display minimise button only
            $minimiseButton.show();
            $maximiseButton.hide();
            $closeButton.hide();

        }

    };

    var onMinimiseClick = function() {

        bigDiagramExists = false;
        $( '.maximise-button' ).css( 'pointer-events', '' );

        // Remove the popup conatainer and append svgContainer to diagramContainer
        $popupContainer.detach();
        $diagramContainer.append( $( this ).parent() );

        // Unhighlight any selected clusters
        svg.selectAll(".group path")
          .style("stroke", function(d) { return colorGroup(d.index); })
          .style("fill", function(d) { return colorGroup(d.index); });

        // Hide any tooltips that were displayed in the popup container
        $('.tooltip').css("opacity", 0);

        // Display maximise and close buttons only
        $minimiseButton.hide();
        $maximiseButton.show();
        $closeButton.show();

    };

    /* Initialise all the containers and labels for this diagram
     *
     * Small diagram tree:
     *  $( '.main-container' )
     *      $( '.diagrams-container' )
     *          diagramContainerContainer
     *              diagramContainer
     *                  svgContainer (SEE BELOW)
     */
    var $diagramContainerContainer = $( '<div>' ).addClass( 'diagram-container-container' );
    var $diagramContainer = $( '<div>' ).addClass( 'diagram-container' );

    /* Big diagram tree:
     *  $( '.main-container' )
     *      popupContainer
     *          graphContainer
     *              diagramContainerBig
     *                  svgContainer (SEE BELOW)
     *                  searchDiv
     *                      inputGroup
     *                          searchInput
 *                              inputGroupButton
 *                                  searchButton
     *          infoContainer
     *              infoTitle
     *              infoInnerContainer
     *                  infoInnerContainerText
     *          goTermsContainer
     *              goTermsTitle
     *              goTermsList
     *                  goTermsTable
     *                      goTermsTableHead
     *                          goTermsTableHeadings
     *                      goTermsTableBody
     */
    // TODO: classes instead of .css, shared class for all titles
    var $popupContainer = $( '<div>' ).addClass( 'popup-container' );
    var $graphContainer = $( '<div>' ).addClass( 'graph-container' );
    var $diagramContainerBig = $( '<div>' ).addClass( 'diagram-container-big' );

    var $searchDiv = $( '<div>' );
    var $inputGroup = $( '<div>' ).addClass( 'input-group' );
    var $searchInput = $( '<input>' )
        .addClass( 'form-control search-input' )
        .attr( 'type', 'text' )
        .attr( 'placeholder', 'Gene1, Gene2, ...' );
    var $inputGroupButton = $( '<span>' ).addClass( 'input-group-btn' );
    var $searchButton = $( '<button>' )
        .addClass( 'btn btn-default' )
        .text( 'Go' )
        .on( 'click', function() {
            var searchTerms = $searchInput.val();
            if (searchTerms && searchTerms.length > 0) {
                var indeces = [];
                searchTerms = searchTerms.replace(/ /g, '').split(',');
                console.log(searchTerms);
                
                for ( var i = 0, ilen = searchTerms.length; i < ilen; i ++) {
                    var exprClusterIndex = that.geneToCluster[searchTerms[i]] + that.numOrthologyClusters,
                        orthoID = that.geneToGroup[searchTerms[i]],
                        orthoClusterIndex = that.ogToCluster[orthoID];
                    
                    indeces.push(exprClusterIndex, orthoClusterIndex);

                    // Give the clicked-on group a green fill
                    svg.selectAll(".group path")
                      .filter(function(d) {
                        if ( indeces.indexOf(d.index) > -1 ) {
                            return true;
                        } else {
                            return false;
                        }
                      })
                    .transition()
                      .style("fill", "#00FF00");

                    // Keep the non-selected groups their normal color
                    svg.selectAll(".group path")
                      .filter(function(d) {
                        if ( indeces.indexOf(d.index) > -1 ) {
                            return false;
                        } else {
                            return true;
                        }
                      })
                    .transition()
                      .style("fill", function(d) { return colorGroup(d.index); });
                }
            }
            else {
                alert("Please specify at least one gene id.")
            }
        });

    var $infoContainer = $( '<div>' ).addClass( 'info-container' );
    var $infoTitle = $( '<p>' ).addClass( 'info-title' ).text( "Cluster Information" );
    var $infoInnerContainer = $( '<div>' ).addClass('info-inner-container');
    var $infoInnerContainerText = $( '<p>' )
            .text("Click on a cluster to display information about it.")
            .css("text-align", "center")
            .css("width", "100%");
    var $goTermsContainer = $( '<div>' ).addClass('go-terms-container');
    var $goTermsTitle = $( '<h3>' ).text( 'Over-represented GO terms' );
    var $goTermsList = $( '<div>' )
        .text( 'Click on a cluster to see the over-respresented GO terms' )
        .addClass( 'go-terms-list' );
    var $goTermsTable = $( '<table>' )
        .attr( 'id', 'myTable' )
        .attr( 'class', 'tablesorter' );
    var $goTermsTableHead = $( '<thead>' );
    var $goTermsTableHeadings = $( '<tr>' );
    var $goTermsTableBody = $( '<tbody>' );


    /* Both trees:
    *  svgContainer
    *      svgInnerContainer
    *          svg (SEE BELOW)
    *      title
    *      buttons
    */
    var $svgContainer = $( '<div>' ).addClass( 'svg-container' );
    var $svgInnerContainer = $( '<div>' ).addClass( 'svg-inner-container' );
    var $title = $( '<p>' ).addClass( 'diagram-title' ).text( this.species );
    var $closeButton = $( '<div>' )
            .addClass( 'button small-button close-button' )
            .text( '×' )
            .on( 'click', function() {
                $diagramContainerContainer.remove();
            } );
    var $maximiseButton = $( '<div>' )
            .addClass( 'button small-button maximise-button' )
            .text( '+' )
            .on( 'click', onMaximiseClick );
    var $minimiseButton = $( '<div>' )
            .addClass( 'button small-button minimise-button' )
            .text( '−' )
            .on( 'click', onMinimiseClick )
            .hide();

    /*
     *  Append everything as outlined above
     */
    $( '.diagrams-container' ).append( $diagramContainerContainer );
    $diagramContainerContainer.append( $diagramContainer );
    $diagramContainer.append( $svgContainer );

    $searchDiv.append( $inputGroup );
    $inputGroup.append( $searchInput, $inputGroupButton );
    $inputGroupButton.append( $searchButton );

    $popupContainer.append( $graphContainer, $infoContainer, $goTermsContainer );
    $graphContainer.append( $diagramContainerBig );
    $infoContainer.append( $infoTitle, $infoInnerContainer );
    $infoInnerContainer.append( $infoInnerContainerText);
    $goTermsContainer.append( $goTermsTitle, $goTermsList );
    //$goTermsList.apend( $goTermsTable );
    $goTermsTable.append( $goTermsTableHead, $goTermsTableBody );
    $goTermsTableHead.append( $goTermsTableHeadings );
    $goTermsTableHeadings.append(
        $( '<th>' ).addClass( 'table-name' ).text( 'Name' ),
        $( '<th>' ).text( 'Observed' ),
        $( '<th>' ).text( 'Expected' ),
        $( '<th>' ).text( 'Observed/Expected' ),
        $( '<th>' ).text( 'p-value' )
    );

    $svgContainer.append( $title, $minimiseButton, $maximiseButton, $closeButton, $svgInnerContainer );

    /*
     * Draw the circos diagram and append to svgInnerContainer
     */


    var colorGroup = function( x ) {

        // Clusters with lower indices are black
        if ( x < that.numOrthologyClusters ) {
            return "#000000";
        } else {
            return fill( x - that.numOrthologyClusters );
        }

    };

    var checkSignificance = function( d ) {
        // Do node chord analysis on d.target.index and d.source.index
        var o = Math.min( d.target.index, d.source.index );
        var e = Math.max( d.target.index, d.source.index ) - that.numOrthologyClusters;

        if ( that.pValuesOfChords[o][e]['direction'] === 'Over' ) {
            return 1;
        }
        return 0;
    };

    var colorChord = function( d ) {

        var x, significance;

        significance = checkSignificance( d );
        if ( significance === 1 ) {
            // Chords with over-representation
            return "#FFCC14";
        }

        // Color the chords the same as the expression clusters
        x = Math.max( d.target.index, d.source.index ) - that.numOrthologyClusters;
        return fill( x );

    };

    var getChordOpacity = function( d ) {

        var x, significance;

        significance = checkSignificance( d );
        if ( significance === 1 ) {
            return 1;
        }
        return 0.4;

    };
    
    // The following is adapted from http://bl.ocks.org/mbostock/4062006
    var chord = d3.layout.chord()
        .padding(.05)
        .sortSubgroups(d3.descending)
        .matrix(this.circosMatrix);

    var width = 200,
        height = 200,
        innerRadius = Math.min(width, height) * .41,
        outerRadius = innerRadius * 1.1;

    var fill = d3.scale.ordinal()
        .domain(d3.range(10))
        .range(["#CBD4DA", "#BBD9EE"]);

    var svg = d3.select($svgInnerContainer[0]).append("svg")
        .attr("viewBox", "0 0 " + width + " " + height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    svg.append("g")
        .attr("class", "group")
      .selectAll("path")
        .data(chord.groups)
      .enter().append("path")
        .style("fill", function(d) { return colorGroup(d.index); })
        .style("stroke", function(d) { return colorGroup(d.index); })
        .attr("d", d3.svg.arc().innerRadius(innerRadius).outerRadius(outerRadius))
        .on("mouseover", fade(0))
        .on("mouseout", fade(function(d) { return getChordOpacity(d); }))
        .on("mousedown", function(a) {
            // This checks for the immediate children, so at the moment only searchDiv
            if ( $diagramContainerBig.children().length > 1 ) {
                getFacets(a);
            }
        });

    svg.append("g")
        .attr("class", "chord")
      .selectAll("path")
        .data(chord.chords)
      .enter().append("path")
        .attr("d", d3.svg.chord().radius(innerRadius))
        .style("fill", function(d) { return colorChord(d); })
        .style("stroke", function(d) { return colorChord(d); })
        .style("opacity", function(d) { return getChordOpacity(d); });

    // Returns an event handler for fading a given chord group.
    function fade(opacity) {
      return function(g, i) {
        svg.selectAll(".chord path")
            .filter(function(d) { return d.source.index != i && d.target.index != i; })
          .transition()
            .style("opacity", opacity);
      };
    }

    // TODO: clean up getFacets
    function getFacets (a) {
        var orthoLen = that.numOrthologyClusters,
            exprLen = that.numexpressionClusters,
            clusterIndex = a.index,
            species = that.species,
            analysis_id,
            clusterId,
            clusterType,
            ids;

        $('.tooltip').css("opacity", 0);

        if ( species === 'Anopheles') {
            species = 'Anopheles gambiae';
        } else {
            species = 'Plasmodium falciparum';
        }

        // Give the clicked-on group a purple border
        svg.selectAll(".group path")
          .filter(function(d) {
            return d.index === clusterIndex;
          })
        .transition()
          .style("stroke", "#ff00cc");

        // Keep the non-selected groups their normal color
        svg.selectAll(".group path")
          .filter(function(d) {
            return d.index !== clusterIndex;
          })
        .transition()
          .style("stroke", function(d) { return colorGroup(d.index); });

        console.log(clusterIndex + ' ' + species);
        if ( clusterIndex + 1 <= orthoLen ) {
            console.log("we are in ortho");
            analysis_id = that.orthologyClusters[clusterIndex].analysis_id
            ids = that.orthologyClusters[clusterIndex].member_ids;
            clusterId = analysis_id + '_' + ('000'+clusterIndex.toString()).slice(-3);
            clusterType = 'orthology';
        } else {
            console.log("we are in expr");
            var exprIndex = clusterIndex - orthoLen;
            analysis_id = that.expressionClusters[exprIndex].analysis_id;
            ids = that.expressionClusters[exprIndex].member_ids;
            clusterId = analysis_id + '_' + ('000' + exprIndex.toString() ).slice(-3);
            clusterType = 'expression';
        }

        // Construct the request
        var promise1, promise2, promise3;

        if ( clusterIndex + 1 <= orthoLen ) {
            promise1 = getFacetData( 'member_ids',
                                     'og_id',
                                     'id:' + clusterId);
            promise2 = getFacetData( 'member_ids',
                                     'og_id',
                                     'analysis_id:' + analysis_id);

            $.when( promise1, promise2 ).done( function( v1i, v2i ) {
                /* The response is an array with three elements:
                 *   [0]: The actual response from solr.
                 *   [1]: success or failure. Mayne check for this before proceeding?
                 *   [2]: Info from Ajax. Useless.
                 * So we always have to the 0th element of the response.
                 */
               console.log(v1i, v2i)
                var clusterBuckets = v1i[0].facets,
                    genomeBuckets = v2i[0].facets;
                showInfoPanelOrtho(clusterBuckets, genomeBuckets);
            });
        } else {
            // This is the t-test request
            promise1 = $.ajax( 'http://localhost:8081', {
                dataType: 'jsonp',
                data: {
                    'analysisId': analysis_id,
                    'clusterId': clusterId,
                    mode: 'tTest'
                }
            });
            $.when( promise1 ).done( function (answer) {
                console.log('from nodejs', answer);
                showInfoPanelExpr(answer);
            })

        }
        // And this is the go term enrichment.
        promise3 = $.ajax( 'http://localhost:8081',  {
            dataType: 'jsonp',
            data: {
                'analysisId': analysis_id,
                'clusterId': clusterId,
                'clusterType': clusterType,
                'species': species,
                mode: 'goTerms'
            }
        } );
        $.when( promise3 ).done( function( v ) {

            $goTermsTableBody.empty();
            if ( v[0] ) {
                $goTermsList.text( '' );
                $goTermsList.append( $goTermsTable );
                for ( var i = 0; i < v.length; i++ ) {
                    var increase = ( v[i]['observed'] / v[i]['expected'] ).toPrecision( 3 );
                    var $goTermsTableRow = $( '<tr>' );
                    $goTermsTableRow.append(
                        $( '<td>' ).text( v[i]['name'] ),
                        $( '<td>' ).text( v[i]['observed'] ),
                        $( '<td>' ).text( v[i]['expected'].toPrecision( 3 ) ),
                        $( '<td>' ).text( increase ),
                        $( '<td>' ).text( v[i]['pValue'].toPrecision( 3 ) )
                    );
                    $goTermsTableBody.append( $goTermsTableRow );
                }
            } else {
                $goTermsList.text( 'There are no over-represented GO terms in this cluster' );
            }
            $("#myTable").tablesorter( {sortList: [[3, 1]]} );
        } );
    }

    function getFacetData(from, to, initialParameter, filter) {
        var query = '{!join from=' + from + ' to=' + to + '} ' + initialParameter,
            data = {
                'q'     : query,
                'wt'    : 'json',
                'indent': 'true',
                'rows'  : '20000'};

        if ( initialParameter.indexOf('expr') > -1 ) {
            data['rows'] = 1;
            data['json.facet'] =  "{" +
                "conditions    : {" +
                    "terms : {" +
                        "field : 'condition_id'," +
                        "numBuckets    : true," +
                        "limit : 0," +
                        "sort  : { index: 'asc' }," +
                        "facet : {" +
                            "sumsq : 'sumsq(expression_value_d)'," +
                            "avg   : 'avg(expression_value_d)'" +
                        "}" +
                    "}" +
                "}" +
            "}";
        } else if ( initialParameter.indexOf('ortho') > -1 ) {
            data['rows'] = 1;
            data['json.nl'] = 'map';
            data['json.facet'] =  "{" +
                "evorMean : 'avg(evo_rate_f)'," +
                'evoPerc:"percentile(evo_rate_f,5,25,50,75,95)",' +
                'duplMean:"avg(avg_para_count_f)",' +
                'duplPerc:"percentile(avg_para_count_f,5,25,50,75,95)",' +
                'univMean:"avg(frac_species_f)",' +
                'univPerc:"percentile(frac_species_f,5,25,50,75,95)",' +
                'copyMean:"avg(single_copy_frac_f)",' +
                'copyPerc:"percentile(single_copy_frac_f,5,25,50,75,95)",' +
                'paraMean:"avg(copy_num_var_f)",' +
                'paraPerc:"percentile(copy_num_var_f,5,25,50,75,95)",' +
                'evor: {range : {field:evo_rate_f, start:0, end:4, gap:0.13}},' +
                'dupl: {range : {field:avg_para_count_f, start:1, end:31, gap:1.03}},' +
                'univ: {range : {field:frac_species_f, start:0, end:1, gap:0.033}},' +
                'copy: {range : {field:single_copy_frac_f, start:0, end:1, gap:0.033}},' +
                'para: {range : {field:copy_num_var_f, start:0, end:1, gap:0.033}}' +
            "}";
        }

        return $.ajax({
            url: 'http://localhost:8983/solr/circos/query',
            dataType: 'jsonp',
            jsonp: 'json.wrf',
            data: data
        } );
    }
    
    // Display information about the cluster that you are hovering over.
    function showInfoPanelExpr(values) {
        $infoInnerContainer.empty()

        /* From http://bl.ocks.org/d3noob/b3ff6ae1c120eea654b5* (mostly..)*/

        // Set the dimensions of the canvas / graph
        var margin = {top: 0, bottom: 40, left: 70, right: 20},
            // The line plot indide info panel gets its dimensions from graphContainer
            // maybe TODO ?
            width = $infoContainer.width() - margin.left - margin.right,
            height = $graphContainer.height() - margin.top - margin.bottom;

        // Set the ranges
        var x = d3.scale.linear().range([0, width]);
        var y = d3.scale.linear().range([height, 0]);

        // Define the axes
        var xAxis = d3.svg.axis().scale(x)
            .orient("bottom").ticks(5);

        var yAxis = d3.svg.axis().scale(y)
            .orient("left").ticks(5);

        // Add the div for the hoverbox.
        var hoverDiv = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Adds the svg canvas
        var infoPanelsvg = d3.select($infoInnerContainer[0])
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform",
                      "translate(" + margin.left + "," + margin.top + ")");
        
        var maxPValue = -Infinity
        
        // Get the max pValueNegLog10 value so that it can be assigned to the
        // 0 pvalues.
        for ( var i = 0, ilen = values.length; i < ilen; i++ ) {
            if ( maxPValue < values[i].pValueNegLog10 ) {
                maxPValue = values[i].pValueNegLog10;
            }
        }
        
        // Assign the max pvalue + something to the 0 pvalues because otherwise
        // they show up at the bottom of the volcano plot instead of the top.
        for ( var i = 0, ilen = values.length; i < ilen; i++ ) {
            if ( values[i].pValueNegLog10 === null ) {
                values[i].pValueNegLog10 = (maxPValue + 1/100 * maxPValue);
            }
        }

        // Get the data
        var data = values,
            dotRadius = 3.5,
            maxYCoord = d3.max(data, function (d) {return d.pValueNegLog10}),
            minYCoord = d3.min(data, function (d) { return d.pValueNegLog10}),
            maxXCoord = d3.max(data, function (d) {return d.foldChange}),
            minXCoord = d3.min(data, function (d) { return d.foldChange}),
            YSpan = (maxYCoord - minYCoord) / 100;
        
        // Scale the range of the data
        x.domain([minXCoord - dotRadius / 100, maxXCoord + dotRadius / 100]);
        y.domain([minYCoord - YSpan, maxYCoord + YSpan]);

        // Add the dots
        infoPanelsvg.selectAll("dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("r", dotRadius)
            .attr("cx", function(d) { return x(d.foldChange); })
            .attr("cy", function(d) { return y(d.pValueNegLog10); })
            .style("fill", function (d) {
                // This used to have a check for pValue !== null but the foldChange check
                // superseeds it.
                if (d.foldChange < 0.5 && d.foldChange > -0.5) {
                    return '#bbb';
                }
            })
            .on("mouseover", function(d) {
                var conditionId = d.conditionId,
                    promise = getConditionInfo(conditionId),
//                    promise = PostToSolr(conditionId, [], 1, false),
                    conditionName,
                    pvalue = d.pValue,
                    xcoord = d3.event.pageX,
                    ycoord = d3.event.pageY;

                $.when(promise).done(function (reply) {
                    // The response json array always has length 1
                    conditionName = reply.response.docs[0].name;
                    hoverDiv.transition()
                        .duration(200)
                        .style("opacity", .9);

                    hoverDiv.html(conditionName)
                        .style("left", xcoord + "px")
                        .style("top", ycoord + "px");
                });
            })
            .on("mouseout", function(d) {
                hoverDiv.transition()
                    .duration(500)
                    .style("opacity", 0)
            });

        // Add the X Axis
        infoPanelsvg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        // Add the Y Axis
        infoPanelsvg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        // Add the 0.05 and 0.01 p-value significance lines
        infoPanelsvg.append("svg:line")
            .attr("class", "significance line")
            .attr({
                'x1': x(d3.min(data, function (d) { return d.foldChange - 0.01})),
                'x2': x(d3.max(data, function (d) { return d.foldChange + 0.01})),
                'y1': y(-Math.log10(0.05 / values.length)),
                'y2': y(-Math.log10(0.05 / values.length))
            })
            .style("stroke", "#FFCC14")
            .style("stroke-dasharray", ("5, 5"));

        // Add the X axis label
        infoPanelsvg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 5)
            .style("text-anchor", "middle")
            .text("log2 fold change");

        // Add the Y axis label
        infoPanelsvg.append("text")
            .attr("x", 0 - (height / 2))
            .attr("y", 0 - margin.left + 25)
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .text("-log10 p-value");
    }

    // Display information about the cluster that you are hovering over.
    function showInfoPanelOrtho(clusterBuckets, genomeBuckets) {
        var minSpeciesRatio = 10000,
            clusters = [clusterBuckets, genomeBuckets],
            orthologyValues = [],
            ogClusterStats = [];

        for ( var i = 0, ilen = clusters.length; i < ilen; i++ ) {
            orthologyValues[i] = {
                'evorHist': clusters[i].evor.buckets,
                'evorMean': clusters[i].evorMean,
                'evorPerc': clusters[i].evoPerc,
                'duplHist': clusters[i].dupl.buckets,
                'duplMean': clusters[i].duplMean,
                'duplPerc': clusters[i].duplPerc,
                'univHist': clusters[i].univ.buckets,
                'univMean': clusters[i].univMean,
                'univPerc': clusters[i].univPerc,
                'copyHist': clusters[i].copy.buckets,
                'copyMean': clusters[i].copyMean,
                'copyPerc': clusters[i].copyPerc,
                'paraMean': clusters[i].paraMean,
                'paraPerc': clusters[i].paraPerc,
                'paraHist': clusters[i].para.buckets
            };
        };

        console.log(orthologyValues)

        $infoInnerContainer.empty()

        /* From vector-violin.js@ninjaviewer (mostly) */

        // Set the dimensions of the canvas / graph
        var margin = {top: 30, bottom: 30, left: 30, right: 20},
            width = $infoContainer.width() - margin.left - margin.right,
            height = $graphContainer.height() - margin.top - margin.bottom;

        console.log('dimensions', width, height, margin)

        var boxSpacing = 10;
        var boxWidth = width / 10 - boxSpacing;

        var domain = [0, 4];
        var resolution = 20;
        var d3ObjId = "violin";
        var interpolation = 'basis';

        var evoRateDiv = d3.select($infoInnerContainer[0])
            .append("div")
//                .attr("class", "evo-rate-div")
                .style("width", "20%")
                .style("height", height + "px")

        var svg = evoRateDiv.append("svg")
            .attr("style", 'width: 100%; height: 100%; border: 0');

        var yEvor = d3.scale.linear()
            .range([height - margin.bottom, margin.top])
            .domain(domain)
            .nice();

        var yAxisEvor = d3.svg.axis()
            .scale(yEvor)
            .orient("left");

        svg.append("text")
            .attr('class', 'violin-header')
            .attr("x", margin.left + boxWidth)
            .attr("y", margin.top/2)
            .style("text-anchor", "middle")
            .text("Evolutionary Rate");

        svg.append("text")
            .attr("x", margin.left + boxWidth/2)
            .attr("y", height - margin.bottom/2)
            .style("text-anchor", "middle")
            .text("All");

        svg.append("text")
            .attr("x", margin.left + boxWidth + boxWidth/2)
            .attr("y", height - margin.bottom/2)
            .style("text-anchor", "middle")
            .text("Cluster");

        // add the global chart
        var g = svg.append("g").attr("transform", "translate(" + (0 * (boxWidth) + margin.left) + ",0)");

        addViolin(g, orthologyValues[1].evorHist, [height - margin.bottom, margin.top], boxWidth, domain, resolution, interpolation, 0.25, false);
        addBoxPlot(g, orthologyValues[1].evorPerc, orthologyValues[1].evorMean, [height - margin.bottom, margin.top], boxWidth, domain, .15, false);

        // add the chart for the cluster
        g = svg.append("g").attr("transform", "translate(" + (1 * (boxWidth) + margin.left) + ",0)");

        addViolin(g, orthologyValues[0].evorHist, [height - margin.bottom, margin.top], boxWidth, domain, resolution, interpolation, 0.25, false);
        addBoxPlot(g, orthologyValues[0].evorPerc, orthologyValues[0].evorMean, [height - margin.bottom, margin.top], boxWidth, domain, .15, false);

        svg.append("g")
            .attr('class', 'axis')
            .attr("transform", "translate(" + margin.left + ",0)")
            .call(yAxisEvor);

        // Duplicability
        var duplDiv = d3.select($infoInnerContainer[0])
            .append("div")
//                .attr("class", "evo-rate-div")
                .style("width", "20%")
                .style("height", height + "px")

        svg = duplDiv.append("svg")
            .attr("style", 'width: 100%; height: 100%; border: 0');

        domain = [1, 31];
        var yDupl = d3.scale.log()
            .range([height - margin.bottom, margin.top])
            .domain(domain)
            .nice();

        var yAxisDupl = d3.svg.axis()
            .scale(yDupl)
            .orient("left")
            .ticks(3, ",.1s")
            .tickSize(6, 0);

        svg.append("text")
            .attr('class', 'violin-header')
            .attr("x", margin.left + boxWidth)
            .attr("y", margin.top/2)
            .style("text-anchor", "middle")
            .text("Duplicability");

        svg.append("text")
            .attr("x", margin.left + boxWidth/2)
            .attr("y", height - margin.bottom/2)
            .style("text-anchor", "middle")
            .text("All");

        svg.append("text")
            .attr("x", margin.left + boxWidth + boxWidth/2)
            .attr("y", height - margin.bottom/2)
            .style("text-anchor", "middle")
            .text("Cluster");

        g = svg.append("g").attr("transform", "translate(" + (0 * (boxWidth) + margin.left) + ",0)");
        //var g = svg.append("g").attr("transform", "translate(" + (0 * (boxWidth + boxSpacing) + margin.left) + ",-" + margin.top + ")");

        addViolin(g, orthologyValues[1].duplHist, [height - margin.bottom, margin.top], boxWidth, domain, resolution, interpolation, 0.25, true);
        addBoxPlot(g, orthologyValues[1].duplPerc, orthologyValues[1].duplMean, [height - margin.bottom, margin.top], boxWidth, domain, .15, true);

        // add the chart for the cluster
        g = svg.append("g").attr("transform", "translate(" + (1 * (boxWidth) + margin.left) + ",0)");

        addViolin(g, orthologyValues[0].duplHist, [height - margin.bottom, margin.top], boxWidth, domain, resolution, interpolation, 0.25, true);
        addBoxPlot(g, orthologyValues[0].duplPerc, orthologyValues[0].duplMean, [height - margin.bottom, margin.top], boxWidth, domain, .15, true);

        svg.append("g")
            .attr('class', 'axis')
            .attr("transform", "translate(" + (margin.left) + ",0)")
            .call(yAxisDupl);

//        // Universality
        var univDiv = d3.select($infoInnerContainer[0])
            .append("div")
//                .attr("class", "evo-rate-div")
                .style("width", "20%")
                .style("height", height + "px")

        svg = univDiv.append("svg")
            .attr("style", 'width: 100%; height: 100%; border: 0');

        domain = [0, 1];
        var yUniv = d3.scale.linear()
            .range([height - margin.bottom, margin.top])
            .domain(domain)
            .nice();

        var yAxisUniv = d3.svg.axis()
            .scale(yUniv)
            .orient("left");

        svg.append("text")
            .attr('class', 'violin-header')
            .attr("x", margin.left + boxWidth)
            .attr("y", margin.top/2)
            .style("text-anchor", "middle")
            .text("Universality");

        svg.append("text")
            .attr("x", margin.left + boxWidth/2)
            .attr("y", height - margin.bottom/2)
            .style("text-anchor", "middle")
            .text("All");

        svg.append("text")
            .attr("x", margin.left + boxWidth + boxWidth/2)
            .attr("y", height - margin.bottom/2)
            .style("text-anchor", "middle")
            .text("Cluster");


        g = svg.append("g").attr("transform", "translate(" + (0 * (boxWidth) + margin.left) + ",0)");
        //var g = svg.append("g").attr("transform", "translate(" + (0 * (boxWidth + boxSpacing) + margin.left) + ",-" + margin.top + ")");

        addViolin(g, orthologyValues[1].univHist, [height - margin.bottom, margin.top], boxWidth, domain, resolution, interpolation, 0.25, false);
        addBoxPlot(g, orthologyValues[1].univPerc, orthologyValues[1].univMean, [height - margin.bottom, margin.top], boxWidth, domain, .15, false);

        // add the chart for the cluster
        g = svg.append("g").attr("transform", "translate(" + (1 * (boxWidth) + margin.left) + ",0)");

        addViolin(g, orthologyValues[0].univHist, [height - margin.bottom, margin.top], boxWidth, domain, resolution, interpolation, 0.25, false);
        addBoxPlot(g, orthologyValues[0].univPerc, orthologyValues[0].univMean, [height - margin.bottom, margin.top], boxWidth, domain, .15, false);

        svg.append("g")
            .attr('class', 'axis')
            .attr("transform", "translate(" + margin.left + ",0)")
            .call(yAxisUniv);

//        // copy_num_var_f
        var paraDiv = d3.select($infoInnerContainer[0])
            .append("div")
//                .attr("class", "evo-rate-div")
                .style("width", "20%")
                .style("height", height + "px");

        svg = paraDiv.append("svg")
            .attr("style", 'width: 100%; height: 100%; border: 0');

        domain = [0, 1];
        var yPara = d3.scale.linear()
            .range([height - margin.bottom, margin.top])
            .domain(domain)
            .nice();

        var yAxisPara = d3.svg.axis()
            .scale(yPara)
            .orient("left");

        svg.append("text")
            .attr('class', 'violin-header')
            .attr("x", margin.left + boxWidth)
            .attr("y", margin.top/2)
            .style("text-anchor", "middle")
            .text("Paralogue Variation");

        svg.append("text")
            .attr("x", margin.left + boxWidth/2)
            .attr("y", height - margin.bottom/2)
            .style("text-anchor", "middle")
            .text("All");

        svg.append("text")
            .attr("x", margin.left + boxWidth + boxWidth/2)
            .attr("y", height - margin.bottom/2)
            .style("text-anchor", "middle")
            .text("Cluster");


        g = svg.append("g").attr("transform", "translate(" + (0 * (boxWidth) + margin.left) + ",0)");
        //var g = svg.append("g").attr("transform", "translate(" + (0 * (boxWidth + boxSpacing) + margin.left) + ",-" + margin.top + ")");

        addViolin(g, orthologyValues[1].paraHist, [height - margin.bottom, margin.top], boxWidth, domain, resolution, interpolation, 0.25, false);
        addBoxPlot(g, orthologyValues[1].paraPerc, orthologyValues[1].paraMean, [height - margin.bottom, margin.top], boxWidth, domain, .15, false);

        // add the chart for the cluster
        g = svg.append("g").attr("transform", "translate(" + (1 * (boxWidth) + margin.left) + ",0)");

        addViolin(g, orthologyValues[0].paraHist, [height - margin.bottom, margin.top], boxWidth, domain, resolution, interpolation, 0.25, false);
        addBoxPlot(g, orthologyValues[0].paraPerc, orthologyValues[0].paraMean, [height - margin.bottom, margin.top], boxWidth, domain, .15, false);

        svg.append("g")
            .attr('class', 'axis')
            .attr("transform", "translate(" + margin.left + ",0)")
            .call(yAxisPara);

//        // single_copy_frac_f
        var copyDiv = d3.select($infoInnerContainer[0])
            .append("div")
//                .attr("class", "evo-rate-div")
                .style("width", "20%")
                .style("height", height + "px")

        svg = copyDiv.append("svg")
            .attr("style", 'width: 100%; height: 100%; border: 0');

        domain = [0, 1];
        var yCopy = d3.scale.linear()
            .range([height - margin.bottom, margin.top])
            .domain(domain)
            .nice();

        var yAxisCopy = d3.svg.axis()
            .scale(yUniv)
            .orient("left");

        svg.append("text")
            .attr('class', 'violin-header')
            .attr("x", margin.left + boxWidth)
            .attr("y", margin.top/2)
            .style("text-anchor", "middle")
            .text("Single copy genes ratio");

        svg.append("text")
            .attr("x", margin.left + boxWidth/2)
            .attr("y", height - margin.bottom/2)
            .style("text-anchor", "middle")
            .text("All");

        svg.append("text")
            .attr("x", margin.left + boxWidth + boxWidth/2)
            .attr("y", height - margin.bottom/2)
            .style("text-anchor", "middle")
            .text("Cluster");


        g = svg.append("g").attr("transform", "translate(" + (0 * (boxWidth) + margin.left) + ",0)");
        //var g = svg.append("g").attr("transform", "translate(" + (0 * (boxWidth + boxSpacing) + margin.left) + ",-" + margin.top + ")");

        addViolin(g, orthologyValues[1].copyHist, [height - margin.bottom, margin.top], boxWidth, domain, resolution, interpolation, 0.25, false);
        addBoxPlot(g, orthologyValues[1].copyPerc, orthologyValues[1].copyMean, [height - margin.bottom, margin.top], boxWidth, domain, .15, false);

        // add the chart for the cluster
        g = svg.append("g").attr("transform", "translate(" + (1 * (boxWidth) + margin.left) + ",0)");

        addViolin(g, orthologyValues[0].copyHist, [height - margin.bottom, margin.top], boxWidth, domain, resolution, interpolation, 0.25, false);
        addBoxPlot(g, orthologyValues[0].copyPerc, orthologyValues[0].copyMean, [height - margin.bottom, margin.top], boxWidth, domain, .15, false);

        svg.append("g")
            .attr('class', 'axis')
            .attr("transform", "translate(" + margin.left + ",0)")
            .call(yAxisUniv);

    }

    function getConditionInfo(conditionId) {
        var data = {
            'q'     : 'id:' + conditionId,
            'wt'    : 'json',
            'indent': 'true'
        }

        return $.ajax({
            url: 'http://localhost:8983/solr/circos/query',
            method: "POST",
            dataType: 'jsonp',
            jsonp: 'json.wrf',
            data: data
        } );
    }

};

function addViolin(svg, results, range, width, domain, resolution, interpolation, imposeMax, log) {


    var dx = (domain[1] / resolution) / 2;
    // for x axis
    var y = d3.scale.linear()
        .range([width / 2, 0])
        .domain([0, Math.max(d3.max(results, function (d) {
            return d.count * 1.5;
        }))]); //0 -  max probability


    if (log) {
        var x = d3.scale.log()
            .range(range)
            .domain(domain)
            .nice();
        console.log('Printing log in violin');
    } else {
        // for y axis
        var x = d3.scale.linear()
            .range(range)
            .domain(domain)
            .nice();
    }


    console.log("Now printing scaled violin area data");
    var area = d3.svg.area()
        .interpolate(interpolation)
        .x(function (d) {
            if (interpolation == "step-before") {
                //console.log(x(d.x + d.dx / 2));
                return x(d.val + dx)
            }
//            console.log('*' + d.val + ':' + x(d.val));
            return x(d.val);
        })
        .y0(width / 2)
        .y1(function (d) {
            return y(d.count);
        });

    var line = d3.svg.line()
        .interpolate(interpolation)
        .x(function (d) {
            if (interpolation == "step-before")
                return x(d.val + dx);
            return x(d.val);
        })
        .y(function (d) {
            return y(d.count);
        });

    var gPlus = svg.append("g");
    var gMinus = svg.append("g");

    gPlus.append("path")
        .datum(results)
        .attr("class", "area")
        .attr("d", area);

    gPlus.append("path")
        .datum(results)
        .attr("class", "violin")
        .attr("d", line);


    gMinus.append("path")
        .datum(results)
        .attr("class", "area")
        .attr("d", area);

    gMinus.append("path")
        .datum(results)
        .attr("class", "violin")
        .attr("d", line);

    var x = width;

    gPlus.attr("transform", "rotate(90,0,0)  translate(0,-" + width + ")");//translate(0,-200)");
    gMinus.attr("transform", "rotate(90,0,0) scale(1,-1)");


}

function addBoxPlot(svg, elmProbs, elmMean, range, width, domain, boxPlotWidth, log) {
    if (log) {
        var y = d3.scale.log()
            .range(range)
            .domain(domain)
            .nice();
        console.log('Printing log in boxplot');

    } else {

        var y = d3.scale.linear()
            .range(range)
            .domain(domain)
            .nice();
    }

    var x = d3.scale.linear()
        .range([0, width]);

    var left = 0.5 - boxPlotWidth / 2;
    var right = 0.5 + boxPlotWidth / 2;

    var probs = [0.05, 0.25, 0.5, 0.75, 0.95];
    for (var i = 0; i < probs.length; i++) {
        probs[i] = y(elmProbs[i]);
    }

    var gBoxPlot = svg.append("g")


    gBoxPlot.append("rect")
        .attr("class", "boxplot fill")
        .attr("x", x(left))
        .attr("width", x(right) - x(left))
        .attr("y", probs[3])
        .attr("height", -probs[3] + probs[1]);

    var iS = [0, 2, 4];
    var iSclass = ["", "median", ""];
    for (var i = 0; i < iS.length; i++) {
        gBoxPlot.append("line")
            .attr("class", "boxplot " + iSclass[i])
            .attr("x1", x(left))
            .attr("x2", x(right))
            .attr("y1", probs[iS[i]])
            .attr("y2", probs[iS[i]])
    }

    iS = [[0, 1], [3, 4]];
    for (i = 0; i < iS.length; i++) {
        gBoxPlot.append("line")
            .attr("class", "boxplot")
            .attr("x1", x(0.5))
            .attr("x2", x(0.5))
            .attr("y1", probs[iS[i][0]])
            .attr("y2", probs[iS[i][1]]);
    }

    gBoxPlot.append("rect")
        .attr("class", "boxplot")
        .attr("x", x(left))
        .attr("width", x(right) - x(left))
        .attr("y", probs[3])
        .attr("height", -probs[3] + probs[1]);

    gBoxPlot.append("circle")
        .attr("class", "boxplot mean")
        .attr("cx", x(0.5))
        .attr("cy", y(elmMean))
        .attr("r", x(boxPlotWidth / 5));

    gBoxPlot.append("circle")
        .attr("class", "boxplot mean")
        .attr("cx", x(0.5))
        .attr("cy", y(elmMean))
        .attr("r", x(boxPlotWidth / 10));


}
