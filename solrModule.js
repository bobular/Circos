var PostToSolr = function (query, filter, nofRows, facet) {
    
    /*
     *
     * filter is always an array and depending on the number of arguments
     * that have to be added to the filter query option its lentgth varies.
     */
    var filterQuery;
    if ( filter.length > 2 ) {
        for ( var i = 0, ilen = filter.length; i < ilen; i++ ) {
            if ( i !== ilen - 1) {
                filterQuery += filter[i] + ' AND ';
            }
        }
    } else if ( filter.length === 1 ) {
        filterQuery = filter.pop();
    } else {
        filterQuery = null;
    }

    var data = {
        'q'     : query,
        'fq'    : filterQuery,
        'wt'    : 'json',
        //'indent': 'true',
        'rows'  : nofRows.toString()
    }

    if ( facet ) {
        data['json.facet'] = "{" +
            "conditions    : {" +
                "terms : {" +
                    "field : 'condition_id'," +
                    "numBuckets    : true," +
                    "limit : 0," +
                    "sort  : { index: 'asc' }," +
                    "facet : {" +
                        "sum   : 'sum(expression_value_d)'," +
                        "sumsq : 'sumsq(expression_value_d)'," +
                        "avg   : 'avg(expression_value_d)'," +
                        "max   : 'max(expression_value_d)'," +
                        "min   : 'min(expression_value_d)'," +
                        "percentiles    : 'percentile(expression_value_d, 25, 50, 75, 99, 99.9)'" +
                    "}" +
                "}" +
            "}" +
        "}";
    };

    console.log(data);

    return $.ajax({
        url         : '/solr/ninjadata/query',
//        method      : 'POST',
//        datatype    : 'jsonp',
//        jsonp       : 'json.wrf',
        data        : data
    });
    
    var _privateMethod = function () {};
};
