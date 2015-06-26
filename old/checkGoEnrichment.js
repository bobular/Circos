var request = require( 'request' );
var rstats = require( 'rstats' );
var go = require( './hypergeometric' );

// N number of black + white balls in the jar
// 		total number GO terms for Anopheles gambiae genes in the analyses
// n number of balls picked from the jar
// 		number of GO terms in cluster of interest
// K number of white balls in the jar
// 		number of GO term of interest for Anopheles gambiae genes in the analyses
// k number of white balls picked out
// 		number of GO term of interest in cluster of interest

// Make the facet part of data
var facet = JSON.stringify( {
	conditions: {
		terms: {
			field: 'go_ids',
			numBuckets: true,
			limit: 0
		}
	}
} );

// Make the data part of the options
var data = {
	//'q': '{!join from=member_ids to=id} id:' + species + '_expr_cluster_' + numExprClusters + '_' + clusterId,
	'q': '{!join from=member_ids to=id} analysis_id:anoph_expr_cluster_25',
	'fl': 'gene_id,go_ids',
	'wt': 'json',
	'rows': '1',
	'json.facet': facet
};

// Make options for the request
var options = {
	url: 'http://localhost:8983/solr/ninjadata/select',
	json: true,
	qs: data
};

// Calculate N
request( options, function( error, response, body ) {
	if ( error ) {
		console.log( error );
	} else {

		var N, n, K, k, term;
		var significantTerms = [];
		var allBuckets = body.facets.conditions.buckets;
		var numBuckets = body.facets.conditions.numBuckets;
		console.log( numBuckets );

		function calculateCountSum( buckets ) {
			var sum = buckets.reduce( function( prev, curr ) {
				return prev + curr.count;
			}, 0 );
			return sum;
		}
		N = calculateCountSum( allBuckets );
		// console.log( 'Total number of GO terms for Anopheles:', N );

		// Calculate n
		data.q = '{!join from=member_ids to=id} id:anoph_expr_cluster_25_000';
		request( options, function( error, response, body ) {
			if ( error ) {
				console.log( error );
			} else {

				//var R = new rstats.session();

				var clusterBuckets = body.facets.conditions.buckets;
				n = calculateCountSum( clusterBuckets );
				// console.log( 'Number of GO terms in cluster:', n );

				// Calculate each K and k
				// Perform analysis for each term
				allBuckets.forEach( function( bucket ) {

					K = bucket.count;
					term = bucket.val;
					// console.log( 'GO term of interest:', term );
					// console.log( 'Total number of GO term of interest for Anopheles:', K );

					function findCountTermOfInterest( buckets ) {
						var count = 0;
						buckets.some( function( b ) {
							if ( b.val === term ) {
								count = b.count;
								return true;
							}
							return false;
						} );
						return count;
					}
					k = findCountTermOfInterest( clusterBuckets );
					// console.log( 'Number of GO term of interest in cluster:', k );


					// R.assign( 'x', k );
					// R.assign( 'm', K );
					// R.assign( 'n', N - K );
					// R.assign( 'k', n );

					//var hyperGeom = R.parseEval("dhyper(x, m, n, k)");
					var hyperGeom = go.logHypergeometric( K, k, N, n );
					if ( hyperGeom < 0.05 / numBuckets ) {
						significantTerms.push( {
							'term': term,
							'pValue': hyperGeom
							//'pValue': hyperGeom[0]
						} );
						//console.log(hyperGeom);
					}

				} );

				console.log( significantTerms, significantTerms.length );

				significantIDs = [];
				var q = significantTerms.forEach( function( value ) {
					significantIDs.push( 'id:"' + value.term + '"' );
				} );
				q = significantIDs.join( ' OR ' );
				console.log( q );

				// Make the data part of the options
				var data = {
					'q': q,
					'fl': 'name,description',
					'wt': 'json',
					'rows': significantTerms.length
				};

				// Make options for the request
				var options = {
					url: 'http://localhost:8983/solr/ninjadata/select',
					json: true,
					qs: data
				};

				// Find the names and descriptions of the significant terms
				request( options, function( error, response, body ) {
					if ( error ) {
						console.log( error );
					} else {
						console.log( body.response.docs );
					}
				} );

			}
		} );

	}
} );