import { Router } from 'express';

export const forecastRouter = Router();

forecastRouter.get('/', (req, res) => {
  res.json({
    district: 'Bangalore East',
    forecastWindowDays: 7,
    predictions: [
      { crimeType: 'Chain Snatching', riskLevel: 'HIGH', increasePercentage: 210, peakWindow: '18:00 - 21:00', hotLocations: ['MG Road', 'Brigade Road'], confidence: 0.87 },
      { crimeType: 'Vehicle Theft', riskLevel: 'MODERATE', increasePercentage: 80, peakWindow: '23:00 - 02:00', hotLocations: ['Koramangala', 'Indiranagar'], confidence: 0.81 },
      { crimeType: 'Pickpocketing', riskLevel: 'HIGH', increasePercentage: 150, peakWindow: '12:00 - 16:00', hotLocations: ['Cubbon Park', 'Lalbagh'], confidence: 0.89 }
    ]
  });
});
