import { Router } from 'express';

export const anomalyRouter = Router();

anomalyRouter.get('/', (req, res) => {
  res.json({
    alerts: [
      {
        id: 'AL-90823',
        timestamp: new Date().toISOString(),
        station: 'Hebbal PS',
        crimeType: 'Vehicle Theft',
        firCountLast3Hours: 9,
        historicalAverage: 2,
        deviationPercentage: 350,
        suggestedAction: 'Check NH-44 service road CCTV cameras.',
        evidenceFirs: ['FIR-5601', 'FIR-5602', 'FIR-5603'],
        confidence: 0.91,
        acknowledged: false
      }
    ]
  });
});
