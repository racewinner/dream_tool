import { Box, Grid, Card, CardContent, Typography, TextField, Button, List, ListItem, ListItemText, ListItemAvatar, Avatar, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';

interface ChatMessage {
  id: string;
  from: string;
  text: string;
  timestamp: string;
  isUser: boolean;
}

interface Facility {
  id: number;
  name: string;
  phoneNumber: string;
}

const commonIssues = [
  'System not starting',
  'Low battery',
  'Inverter not working',
  'PV panels damaged',
  'System performance drop',
];

export default function WhatsAppChatbot() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const fetchFacilities = async () => {
    try {
      const response = await fetch('/api/facilities');
      const data = await response.json();
      setFacilities(data);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    }
  };

  const sendMessage = async () => {
    if (!selectedFacility || !newMessage.trim()) return;

    try {
      // Send message to WhatsApp API
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: selectedFacility.phoneNumber,
          message: newMessage,
        }),
      });

      // Add message to local state
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          from: 'user',
          text: newMessage,
          timestamp: new Date().toISOString(),
          isUser: true,
        },
      ]);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setShowAlert(true);
    }
  };

  const handleQuickResponse = async (issue: string) => {
    setNewMessage(issue);
    await sendMessage();
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        WhatsApp Chatbot
      </Typography>

      {showAlert && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to send message. Please try again.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Facilities
              </Typography>
              {facilities.map((facility) => (
                <Button
                  key={facility.id}
                  fullWidth
                  variant="outlined"
                  onClick={() => setSelectedFacility(facility)}
                  sx={{ mb: 1 }}
                >
                  {facility.name}
                </Button>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <FaWhatsapp size={32} color="#25D366" />
                <Typography variant="h6" sx={{ ml: 2 }}>
                  {selectedFacility?.name || 'Select Facility'}
                </Typography>
              </Box>

              <List>
                {messages.map((message) => (
                  <ListItem
                    key={message.id}
                    sx={{
                      justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                      mb: 2,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: message.isUser ? '#25D366' : '#f5f5f5' }}>
                        {message.isUser ? 'U' : 'W'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={message.text}
                      secondary={new Date(message.timestamp).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>

              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <TextField
                  fullWidth
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  sx={{ mr: 1 }}
                />
                <IconButton color="primary" onClick={sendMessage}>
                  <IoSend />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={showIssueDialog} onClose={() => setShowIssueDialog(false)}>
        <DialogTitle>Common Issues</DialogTitle>
        <DialogContent>
          <List>
            {commonIssues.map((issue) => (
              <ListItem
                key={issue}
                button
                onClick={() => handleQuickResponse(issue)}
              >
                <ListItemText primary={issue} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowIssueDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Button
        variant="contained"
        onClick={() => setShowIssueDialog(true)}
        sx={{ position: 'fixed', bottom: 20, right: 20 }}
      >
        Quick Responses
      </Button>
    </Box>
  );
}
