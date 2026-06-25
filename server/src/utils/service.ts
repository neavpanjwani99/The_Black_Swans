import Fir from "../models/Fir.js"

async function vectorSearch(queryVector: any) {

    const results = await Fir.aggregate([
        {
            $vectorSearch: {
                index: 'autoembed_index',
                path: 'embedding',
                queryVector: queryVector,
                numCandidates: 50,
                limit: 3
            }
        },
        {
            $project: {
                fir_number: 1,
                description: 1,
                ps_name: 1,
                crime_type: 1,
                registered_date: 1,
                score: { $meta: 'vectorSearchScore' }
            }
        }
    ]).exec()
    return results
}

export { vectorSearch }