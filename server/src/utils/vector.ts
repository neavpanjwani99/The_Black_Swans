import { pipeline } from "@xenova/transformers";

export const ConvertToVector = async function getEmbedding(text:string) {
    const embedder = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'  // lightweight HF model
    )
    const output = await embedder(text, {
        pooling: 'mean', normalize: true
    })
    return Array.from(output.data)  // float[] vector
}