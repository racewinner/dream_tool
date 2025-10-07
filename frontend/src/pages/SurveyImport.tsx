import { Box, Grid, Card, CardContent, Typography, Button, TextField, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Simple KoboToolbox API implementation using axios
class KoboToolboxAPI {
  private token: string;
  private baseURL: string;

  constructor({ token, baseURL = 'https://kf.kobotoolbox.org' }: { token: string; baseURL?: string }) {
    this.token = token;
    this.baseURL = baseURL;
  }

  private getHeaders() {
    return {
      'Authorization': `Token ${this.token}`,
      'Content-Type': 'application/json'
    };
  }

  forms = {
    list: async () => {
      const response = await axios.get(`${this.baseURL}/api/v2/assets/`, {
        headers: this.getHeaders()
      });
      return response;
    },
    data: {
      list: async (assetUid: string) => {
        const response = await axios.get(`${this.baseURL}/api/v2/assets/${assetUid}/data/`, {
          headers: this.getHeaders()
        });
        return response;
      }
    }
  };
}

interface SurveyData {
  id: string;
  name: string;
  facilityType: string;
  dailyUsage: number;
  equipment: Array<{ name: string; power: number; hours: number }>;
}

export default function SurveyImport() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string>('');
  const [formData, setFormData] = useState<SurveyData | null>(null);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const fetchSurveys = async () => {
    try {
      const kobo = new KoboToolboxAPI({
        token: process.env.REACT_APP_KOBOTOOLBOX_TOKEN || '',
      });
      const response = await kobo.forms.list();
      setSurveys(response.data.results);
    } catch (err) {
      setError('Failed to fetch surveys from KoboToolbox');
    }
  };

  const importSurvey = async () => {
    if (!selectedSurvey) return;

    try {
      const kobo = new KoboToolboxAPI({
        token: process.env.REACT_APP_KOBOTOOLBOX_TOKEN || '',
      });

      const response = await kobo.forms.data.list(selectedSurvey);
      const surveyData = response.data.results[0]; // Get the latest survey

      // Extract relevant data
      const extractedData: SurveyData = {
        id: surveyData._id,
        name: surveyData.facility_name,
        facilityType: surveyData.facility_type,
        dailyUsage: surveyData.daily_energy_usage,
        equipment: surveyData.equipment.map((eq: any) => ({
          name: eq.name,
          power: eq.power,
          hours: eq.hours,
        })),
      };

      setFormData(extractedData);
    } catch (err) {
      setError('Failed to import survey data');
    }
  };

  const saveToDatabase = async () => {
    if (!formData) return;

    try {
      await fetch('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      navigate('/techno-economic');
    } catch (err) {
      setError('Failed to save survey data');
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Survey Import
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select Survey
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Survey</InputLabel>
                <Select
                  value={selectedSurvey}
                  onChange={(e) => setSelectedSurvey(e.target.value as string)}
                >
                  {surveys.map((survey) => (
                    <MenuItem key={survey.id} value={survey.id}>
                      {survey.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                onClick={importSurvey}
                disabled={!selectedSurvey}
              >
                Import Survey
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {formData && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Survey Data Preview
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Facility Name"
                      value={formData.name}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Facility Type"
                      value={formData.facilityType}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Daily Energy Usage (kWh)"
                      value={formData.dailyUsage}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1">
                      Equipment List
                    </Typography>
                    {formData.equipment.map((eq, index) => (
                      <Grid container spacing={2} key={index}>
                        <Grid item xs={4}>
                          <TextField
                            fullWidth
                            label="Equipment Name"
                            value={eq.name}
                            disabled
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField
                            fullWidth
                            label="Power (W)"
                            value={eq.power}
                            disabled
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField
                            fullWidth
                            label="Hours per Day"
                            value={eq.hours}
                            disabled
                          />
                        </Grid>
                      </Grid>
                    ))}
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={saveToDatabase}
                      sx={{ mt: 2 }}
                    >
                      Save to Database
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
