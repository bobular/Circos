var matr = require( './nodegetmatrix' );

var clusterSizes = [2, 4, 5, 10, 15, 20, 25];
var i, j, length = clusterSizes.length;

for ( i = 0; i < length; i++ ) {
	for ( j = 0; j < length; j++ ) {
		table = matr.getMatrix(
			'clustering_id',
			'(anoph_expr_cluster_' + clusterSizes[i] + ' OR anoph_ortho_cluster_' + clusterSizes[j] + ')',
			'clustering_id,member_ids'
		);
	}
}
