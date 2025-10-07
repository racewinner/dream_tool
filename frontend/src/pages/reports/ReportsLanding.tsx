import React, { useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Divider,
  Chip
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import DownloadIcon from '@mui/icons-material/Download';
import DateRangeIcon from '@mui/icons-material/DateRange';
import FilterListIcon from '@mui/icons-material/FilterList';
import ShareIcon from '@mui/icons-material/Share';
import MoreVertIcon from '@mui/icons-material/MoreVert';

/**
 * Reports Landing Page - Main entry point for all reporting features
 */
const ReportsLanding: React.FC = () => {
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null);

  // Sample featured reports
  const featuredReports = [
    {
      id: 1,
      title: "Monthly Performance Summary",
      description: "System performance metrics across all sites for the current month",
      image: "https://via.placeholder.com/400x200?text=Monthly+Performance",
      category: "Performance",
      lastUpdated: "Today",
      downloads: 128
    },
    {
      id: 2,
      title: "Maintenance Activity Log",
      description: "Detailed log of all maintenance activities and resolutions",
      image: "https://via.placeholder.com/400x200?text=Maintenance+Log",
      category: "Maintenance",
      lastUpdated: "Yesterday",
      downloads: 57
    },
    {
      id: 3,
      title: "Energy Production Forecast",
      description: "Predictive analysis of energy production for the next quarter",
      image: "https://via.placeholder.com/400x200?text=Energy+Forecast",
      category: "Forecasting",
      lastUpdated: "3 days ago",
      downloads: 94
    },
    {
      id: 4,
      title: "Financial Impact Assessment",
      description: "Cost savings and financial benefits of renewable energy systems",
      image: "https://via.placeholder.com/400x200?text=Financial+Impact",
      category: "Financial",
      lastUpdated: "1 week ago",
      downloads: 215
    }
  ];
  
  // Sample report categories
  const reportCategories = [
    {
      title: "Performance Reports",
      icon: "https://via.placeholder.com/64?text=P",
      description: "System efficiency and output metrics",
      count: 15
    },
    {
      title: "Maintenance Reports",
      icon: "https://via.placeholder.com/64?text=M",
      description: "Service history and issue resolution",
      count: 8
    },
    {
      title: "Financial Reports",
      icon: "https://via.placeholder.com/64?text=F",
      description: "Cost analysis and ROI calculations",
      count: 12
    },
    {
      title: "Environmental Impact",
      icon: "https://via.placeholder.com/64?text=E",
      description: "Carbon offset and sustainability metrics",
      count: 6
    },
    {
      title: "Compliance Reports",
      icon: "https://via.placeholder.com/64?text=C",
      description: "Regulatory compliance documentation",
      count: 9
    },
    {
      title: "Custom Reports",
      icon: "https://via.placeholder.com/64?text=+",
      description: "Personalized analytics and metrics",
      count: 23
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" component="h1" gutterBottom>
            <AssessmentIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Reports & Analytics
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Generate and access reports for all aspects of your renewable energy systems
          </Typography>
        </div>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<DateRangeIcon />}>
            Date Range
          </Button>
          <Button variant="outlined" startIcon={<FilterListIcon />}>
            Filters
          </Button>
          <Button variant="contained" startIcon={<DownloadIcon />}>
            Export
          </Button>
        </Box>
      </Box>

      {/* Featured Reports Carousel */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Featured Reports
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {featuredReports.map((report) => (
          <Grid item xs={12} md={6} lg={3} key={report.id}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea onClick={() => console.log('Report clicked:', report.title)}>
                <CardMedia
                  component="img"
                  height="140"
                  image={report.image}
                  alt={report.title}
                />
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip size="small" label={report.category} color="primary" />
                    <Typography variant="caption" color="textSecondary">
                      Updated: {report.lastUpdated}
                    </Typography>
                  </Box>
                  <Typography variant="h6" component="div" gutterBottom>
                    {report.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {report.description}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    <DownloadIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                    {report.downloads} downloads
                  </Typography>
                </CardContent>
              </CardActionArea>
              <CardContent sx={{ pt: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button size="small" startIcon={<ShareIcon />} onClick={(e) => { e.stopPropagation(); console.log('Share clicked'); }}>
                    Share
                  </Button>
                  <Button size="small" startIcon={<DownloadIcon />} onClick={(e) => { e.stopPropagation(); console.log('Download clicked'); }}>
                    Download
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Report Categories */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Report Categories
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {reportCategories.map((category, index) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
            <Paper 
              sx={{ 
                p: 2, 
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
              onClick={() => setSelectedReportType(category.title)}
            >
              <Box 
                component="img" 
                src={category.icon} 
                alt={category.title} 
                sx={{ 
                  width: 64, 
                  height: 64, 
                  margin: '0 auto',
                  mb: 2
                }}
              />
              <Typography variant="subtitle1" component="div" gutterBottom>
                {category.title}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2, flexGrow: 1 }}>
                {category.description}
              </Typography>
              <Chip 
                label={`${category.count} Reports`} 
                color="primary" 
                size="small" 
                sx={{ alignSelf: 'center' }}
              />
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Recent Reports */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Recent Reports
        </Typography>
        <Button size="small" endIcon={<MoreVertIcon />}>
          View All
        </Button>
      </Box>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5].map((item) => (
            <React.Fragment key={item}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AssessmentIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="subtitle1">
                        {item === 1 && "Weekly Performance Summary"}
                        {item === 2 && "System Health Check Report"}
                        {item === 3 && "Carbon Offset Analysis"}
                        {item === 4 && "Maintenance Cost Breakdown"}
                        {item === 5 && "Energy Production vs. Consumption"}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {item === 1 && "Generated on Jul 24, 2023 • Performance • 15 pages"}
                        {item === 2 && "Generated on Jul 22, 2023 • System • 8 pages"}
                        {item === 3 && "Generated on Jul 20, 2023 • Environmental • 12 pages"}
                        {item === 4 && "Generated on Jul 15, 2023 • Financial • 10 pages"}
                        {item === 5 && "Generated on Jul 10, 2023 • Energy • 18 pages"}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <Button size="small" startIcon={<DownloadIcon />}>
                      Download
                    </Button>
                    <Button size="small" startIcon={<ShareIcon />}>
                      Share
                    </Button>
                  </Box>
                </Box>
              </Grid>
              {item < 5 && (
                <Grid item xs={12}>
                  <Divider />
                </Grid>
              )}
            </React.Fragment>
          ))}
        </Grid>
      </Paper>

      {/* Create Custom Report */}
      <Paper sx={{ p: 4, bgcolor: 'primary.main', color: 'white' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h5" component="div" gutterBottom>
              Need a customized report?
            </Typography>
            <Typography variant="body1" paragraph>
              Create tailored reports with specific metrics, date ranges, and visualization options to meet your exact requirements.
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              sx={{ 
                bgcolor: 'white', 
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'grey.100'
                }
              }}
            >
              Create Custom Report
            </Button>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Box 
              component="img" 
              src="https://via.placeholder.com/300x200?text=Custom+Reports" 
              alt="Custom Reports"
              sx={{ 
                width: '100%',
                borderRadius: 1,
                boxShadow: 3
              }}
            />
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ReportsLanding;
