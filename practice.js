function getData( field, value ) {

	var data = {
		'q'		: field + ':' + value,
		'wt'	: 'json',
		'indent': 'true',
		'rows' 	: '200'
	};

	return $.ajax( 'solr.php', {
		method: 'POST',
		data: data
	} );

}

var optionsPromise1 = getData( 'type', 'expr_cluster' );
var optionsPromise2 = getData( 'type', 'ortho_cluster' );

$.when( optionsPromise1, optionsPromise2 ).done( function( v1, v2 ) {

	var i, key, options, option, chosenExpressionOption, chosenOrthoOption,
		expressionOptions = v1[0].response.docs,
		orthologyOptions = v2[0].response.docs;

	function populateSelect( data, selectClass ) {
		options = {};
		for ( i = 0, ilen = data.length; i < ilen; i++ ) {
			options[data[i].clustering_id[0]] = true;
		}
		for ( key in options ) {
			if ( options.hasOwnProperty( key ) ) {
				option = $( '<option>' ).text( key );
				$( '.' + selectClass ).append( option );
			}
		}
	}

	function makeCircos( chosenExpressionOption, chosenOrthoOption ) {

		var promise1 = getData( 'clustering_id', chosenExpressionOption );
		var promise2 = getData( 'clustering_id', chosenOrthoOption );

		$.when( promise1, promise2 ).done( function( v1, v2 ) {

			var	expr = v1[0].response.docs,
				ortho = v2[0].response.docs,
				m = new Practice.Matrix( expr, ortho, mapDict ); // TODO sort out mapDict

			m.drawCircos();

		});

	}

	populateSelect( expressionOptions, 'expr-cluster-select' );
	populateSelect( orthologyOptions, 'ortho-cluster-select' );

	$( '.btn-drawCircos' )
		.removeClass( 'btn-disabled' )
		.on( 'click', function() {

			chosenExpressionOption = $( '.expr-cluster-select' ).val();
			chosenOrthoOption = $( '.ortho-cluster-select' ).val();
			makeCircos( chosenExpressionOption, chosenOrthoOption );

		} );

});