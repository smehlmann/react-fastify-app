import * as reportGetters from './reportGetters.js';

async function runStigBenchmarkByResults(tokens, args) {

    var collections = await reportGetters.getCollections(tokens.access_token);
    for (var i = 0; i < collections.length; i++) {
        var collectionName = collections[i].name;
        var collectionId = collections[i].collectionId;

        var stigs = await reportGetters.getStigs(tokens.access_token,
            collections[i].collectionId);
            
            for(var j = 0; j < stigs.length; j++){
                var benchmarkId = stigs[j].benckmarkId;

                var revisions = await reportGetters.getBenchmarkRevisions(
                    tokens.access_token,
                    benchmarkId);
            }
    }
}

export { runStigBenchmarkByResults }