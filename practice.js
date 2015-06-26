function getData( field, value, filter ) {

	var data = {
		'q'		: field + ':' + value,
		'fq'	: 'analysis_type:clustering',
		'fl'	: filter,
		'wt'	: 'json',
		'indent': 'true',
		'rows' 	: '20000'
	};

	return $.ajax( '/solr/ninjadata/select', {
		dataType: 'json',
		data: data
	} );

}

function showOptions( species ) {

	var i, key,
		option,
		type,
		types = ['expr', 'ortho'];

	for ( i = 0; i < types.length; i++ ) {
		type = types[i];
		$( '.' + type  + '-cluster-select' ).empty();
		for ( key in optionsDict[species][type] ) {
			option = $( '<option>' ).text( optionsDict[species][type][key] );
			$( '.' + type + '-cluster-select' ).append( option );
		}
	}

	// Make draw button use selectedSpecies data
	$( '.btn-drawCircos' )
		.removeClass( 'btn-disabled' ) // Only necessary the first time
		.off() // Remove the old onclick function
		.on( 'click', function() {

			chosenExpressionOption = selectedSpecies + '_expr_cluster_' + $( '.expr-cluster-select' ).val();
			chosenOrthoOption = selectedSpecies + '_ortho_cluster_' + $( '.ortho-cluster-select' ).val();
			makeCircos( chosenExpressionOption, chosenOrthoOption );

		} );

}

function makeCircos( chosenExpressionOption, chosenOrthoOption ) {

	var promise = $.ajax( '/circos-data',  {
		dataType: 'json',
		data: {
			value: '('
				+ chosenExpressionOption
				+ ' OR '
				+ chosenOrthoOption
				+ ')',
			// id is cluster id, needed for the geneToCluster dictionary
			filter: 'analysis_id,id,member_ids',
			mode: 'draw'
		}
	} );

	$.when( promise ).done( function( v ) {
		m = new ClusterAnalysis.Diagram( v, selectedSpecies );
	} );

}

var selectedSpecies = 'anoph',
	bigDiagramExists = false;

var optionsDict = {
		'anoph': {
			'expr': {},
			'ortho': {}
		},
		'plasmo': {
			'expr': {},
			'ortho': {}
		}
	};

var optionsPromise1 = getData( 'type', 'analysis', 'id' );

$.when( optionsPromise1 ).done( function( v1 ) {

	var chosenExpressionOption, chosenOrthoOption, // TODO Move these down
		options = v1.response.docs;

	function populateOptions( data ) {

		var i, idList, species, type, num;

		for ( i = 0, ilen = data.length; i < ilen; i++ ) {

			// WARNING!
			// The following relies on clutering_id being of the form: species_type_cluster_numClusters
			idList = data[i].id.split( '_' );
			species = idList[0];
			type = idList[1];
			num = idList[3];
			if ( !optionsDict[species][type][num] ) {
				optionsDict[species][type][num] = num;
			}

		}

	}

	populateOptions( options );

	// First show default species options
	showOptions( selectedSpecies );

	$( '.species-radio' )
		.on( 'change', function() {
			var species = $( '.species-radio:checked' ).val();

			selectedSpecies = species;
			showOptions( selectedSpecies );
		} );

});
