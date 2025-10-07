import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

interface Equipment {
  name: string;
  powerRating: number;
  quantity: number;
  hoursPerDay: number;
  hoursPerNight: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  weeklyUsage: number;
  category: string;
  critical: boolean;
}

interface SurveyData {
  productiveSectors: string[];
  operationalHours: {
    day: number;
    night: number;
  };
  infrastructure: {
    waterAccess: boolean;
    nationalGrid: boolean;
    digitalConnectivity: string;
  };
  equipment: Equipment[];
}

export default function SurveyManagement() {
  const navigate = useNavigate();
  const { facilityId } = useParams();
  const [surveyData, setSurveyData] = useState<SurveyData>({
    productiveSectors: [],
    operationalHours: {
      day: 8,
      night: 0,
    },
    infrastructure: {
      waterAccess: false,
      nationalGrid: false,
      digitalConnectivity: 'low',
    },
    equipment: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSurveys();
  }, [facilityId]);

  const fetchSurveys = async () => {
    try {
      const response = await fetch(`/api/surveys/${facilityId}`);
      if (!response.ok) throw new Error('Failed to fetch surveys');
      const data = await response.json();
      setSurveyData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof SurveyData,
    value: any
  ) => {
    setSurveyData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEquipmentChange = (index: number, field: keyof Equipment, value: any) => {
    setSurveyData(prev => {
      const newEquipment = [...prev.equipment];
      newEquipment[index] = {
        ...newEquipment[index],
        [field]: value,
      };
      return {
        ...prev,
        equipment: newEquipment,
      };
    });
  };

  const handleAddEquipment = () => {
    setSurveyData(prev => ({
      ...prev,
      equipment: [...prev.equipment, {
        name: '',
        powerRating: 0,
        quantity: 1,
        hoursPerDay: 0,
        hoursPerNight: 0,
        timeOfDay: 'morning',
        weeklyUsage: 7,
        category: '',
        critical: false,
      }],
    }));
  };

  const handleRemoveEquipment = (index: number) => {
    setSurveyData(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch(`/api/surveys/${facilityId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyData),
      });

      if (!response.ok) throw new Error('Failed to save survey');
      navigate(`/facility/${facilityId}/techno-economic`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Survey Management
      </Typography>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Grid container spacing={3}>
          {/* Facility Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Facility Information
                </Typography>
                <TextField
                  fullWidth
                  select
                  label="Water Access"
                  value={surveyData.infrastructure.waterAccess}
                  onChange={(e) =>
                    handleInputChange('infrastructure', {
                      ...surveyData.infrastructure,
                      waterAccess: e.target.value === 'true',
                    })
                  }
                >
                  <MenuItem value="false">No</MenuItem>
                  <MenuItem value="true">Yes</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  select
                  label="National Grid Access"
                  value={surveyData.infrastructure.nationalGrid}
                  onChange={(e) =>
                    handleInputChange('infrastructure', {
                      ...surveyData.infrastructure,
                      nationalGrid: e.target.value === 'true',
                    })
                  }
                >
                  <MenuItem value="false">No</MenuItem>
                  <MenuItem value="true">Yes</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  select
                  label="Digital Connectivity"
                  value={surveyData.infrastructure.digitalConnectivity}
                  onChange={(e) =>
                    handleInputChange('infrastructure', {
                      ...surveyData.infrastructure,
                      digitalConnectivity: e.target.value,
                    })
                  }
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </TextField>
              </CardContent>
            </Card>
          </Grid>

          {/* Equipment Management */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Equipment Management
                </Typography>
                <Button
                  variant="contained"
                  onClick={handleAddEquipment}
                  sx={{ mb: 2 }}
                >
                  Add Equipment
                </Button>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Power Rating (W)</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Hours/Day</TableCell>
                        <TableCell>Hours/Night</TableCell>
                        <TableCell>Time of Day</TableCell>
                        <TableCell>Weekly Usage</TableCell>
                        <TableCell>Category</TableCell>
                        <TableCell>Critical</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {surveyData.equipment.map((eq, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <TextField
                              fullWidth
                              value={eq.name}
                              onChange={(e) =>
                                handleEquipmentChange(index, 'name', e.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              type="number"
                              value={eq.powerRating}
                              onChange={(e) =>
                                handleEquipmentChange(
                                  index,
                                  'powerRating',
                                  parseFloat(e.target.value)
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              type="number"
                              value={eq.quantity}
                              onChange={(e) =>
                                handleEquipmentChange(
                                  index,
                                  'quantity',
                                  parseInt(e.target.value)
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              type="number"
                              value={eq.hoursPerDay}
                              onChange={(e) =>
                                handleEquipmentChange(
                                  index,
                                  'hoursPerDay',
                                  parseFloat(e.target.value)
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              type="number"
                              value={eq.hoursPerNight}
                              onChange={(e) =>
                                handleEquipmentChange(
                                  index,
                                  'hoursPerNight',
                                  parseFloat(e.target.value)
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              select
                              value={eq.timeOfDay}
                              onChange={(e) =>
                                handleEquipmentChange(
                                  index,
                                  'timeOfDay',
                                  e.target.value as 'morning' | 'afternoon' | 'evening' | 'night'
                                )
                              }
                            >
                              <MenuItem value="morning">Morning</MenuItem>
                              <MenuItem value="afternoon">Afternoon</MenuItem>
                              <MenuItem value="evening">Evening</MenuItem>
                              <MenuItem value="night">Night</MenuItem>
                            </TextField>
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              type="number"
                              value={eq.weeklyUsage}
                              onChange={(e) =>
                                handleEquipmentChange(
                                  index,
                                  'weeklyUsage',
                                  parseInt(e.target.value)
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              value={eq.category}
                              onChange={(e) =>
                                handleEquipmentChange(index, 'category', e.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              select
                              value={eq.critical}
                              onChange={(e) =>
                                handleEquipmentChange(
                                  index,
                                  'critical',
                                  e.target.value === 'true'
                                )
                              }
                            >
                              <MenuItem value="false">No</MenuItem>
                              <MenuItem value="true">Yes</MenuItem>
                            </TextField>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={() => handleRemoveEquipment(index)}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Save Button */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleSubmit}
              sx={{ mt: 3 }}
            >
              Save Survey
            </Button>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
