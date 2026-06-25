import mongoose, { model } from "mongoose";


const FIRSchema = new mongoose.Schema({
    fir_number: { type: String, required: true, unique: true },
    ps_name: { type: String, required: true },        // Police Station
    district: { type: String, required: true },
    state: { type: String, default: 'Karnataka' },
    incident_date: { type: Date, required: true },
    registered_date: { type: Date, required: true },
    crime_type: { type: String, required: true },
    ipc_sections: [{ type: String }],                 // e.g. ['302', '307']
    status: {
        type: String,
        enum: ['Under Investigation', 'Chargesheeted', 'Convicted', 'Absconding', 'Closed'],
        default: 'Under Investigation'
    },
    description: { type: String, required: true },    // raw text for embedding
    accused: [
        {
            name: { type: String },
            alias: { type: String },
            age: { type: Number },
            gender: { type: String, enum: ['Male', 'Female', 'Other'] },
            address: { type: String },
            aadhar_last4: { type: String }
        }
    ],
    victim: [
        {
            name: { type: String },
            age: { type: Number },
            gender: { type: String }
        }
    ],
    officer_incharge: { type: String },
    embedding: { type: [Number], default: [] },        // vector — filled after embed step
    created_at: { type: Date, default: Date.now }
})

export default mongoose.model("FIRSchema",FIRSchema);