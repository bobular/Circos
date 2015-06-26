var request = require( 'request' );
var fs = require( 'fs' );

/**
 * Write a dictionary of genes to orthologous groups to a json file
 * The dictionary contains all of the genes and orthologous groups in the solr database
 *
 * @return {undefined}
 */
function writeDictionary() {

	// Dictionary that will be populated then written to file
	var geneToOG = {};

	// Build query for querying solr for the dictionary data
	var data = {
		'q'		: 'species_s:("Anopheles gambiae" OR "Plasmodium falciparum")',
		'fq'	: 'og_ids:*',
		'fl'	: 'gene_id,og_ids',
		'wt'	: 'json',
		'indent': 'true',
		'rows' 	: '20000'
	};

	// Make options for the request
	var options = {
		url: 'http://localhost:8983/solr/ninjadata/select',
		json: true,
		qs: data
	};

	// Make the request and, if successful write the data to a JSON file
	request( options, function( error, response, body ) {
		if ( error ) {
			console.log( error );
		} else {

			var i,
				dictData = body.response.docs;

			dictData.forEach( function( datum, index ) {
				// og_ids is always array of length 1
				geneToOG[dictData[index].gene_id] = dictData[index].og_ids[0];
			} );

			fs.writeFile( 'geneToOG.json', JSON.stringify( geneToOG ), function( err ) {
				if ( err ) {
					console.error( err );
				} else {
					console.log( 'Successfully written dictionary' );
				}
			} );

		}
	} );

}

writeDictionary();