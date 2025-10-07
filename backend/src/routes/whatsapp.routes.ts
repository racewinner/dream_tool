import express from 'express';
import { WhatsApp, Facility } from '../models';
import { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import axios from 'axios';
import { Op } from 'sequelize';

const router = express.Router();

// WhatsApp API configuration
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://api.whatsapp.com';
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;

// Send message to WhatsApp
router.post('/send', authenticate, async (req: Request, res: Response) => {
  try {
    const { phoneNumber, message, facilityId } = req.body;

    if (!phoneNumber || !message || !facilityId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Save message to database
    const whatsappMessage = await WhatsApp.create({
      facilityId,
      phoneNumber,
      message,
      direction: 'out',
      status: 'sent',
    });

    // Send message via WhatsApp API
    try {
      await axios.post(`${WHATSAPP_API_URL}/v1/messages`, {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: message },
      }, {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      await whatsappMessage.update({ status: 'delivered' });
      res.status(201).json(whatsappMessage);
    } catch (error) {
      await whatsappMessage.update({ status: 'failed' });
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
});

// Get message history for a facility
router.get('/facility/:facilityId', authenticate, async (req: Request, res: Response) => {
  try {
    const messages = await WhatsApp.findAll({
      where: { facilityId: req.params.facilityId },
      order: [['createdAt', 'DESC']],
      include: [{
        model: Facility,
        as: 'facility',
      }],
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch message history' });
  }
});

// Get facility phone number
router.get('/facility/:facilityId/phone', authenticate, async (req: Request, res: Response) => {
  try {
    const facility = await Facility.findOne({
      where: { id: req.params.facilityId },
      attributes: ['phoneNumber'],
    });

    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }

    res.json({ phoneNumber: facility.phoneNumber });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch facility phone number' });
  }
});

// Webhook for receiving WhatsApp messages
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { messaging_product, metadata, contacts, messages } = req.body;

    if (messaging_product !== 'whatsapp') {
      return res.status(400).json({ error: 'Invalid messaging product' });
    }

    const [message] = messages;
    const [contact] = contacts;

    // Save incoming message
    await WhatsApp.create({
      phoneNumber: contact.wa_id,
      message: message.text.body,
      direction: 'in',
      status: 'received',
    });

    // Process incoming message (e.g., triage issues, respond to common queries)
    await processIncomingMessage(message.text.body, contact.wa_id);

    res.status(200).send('OK');
  } catch (error) {
    res.status(500).json({ error: 'Failed to process incoming message' });
  }
});

// Data collection endpoints
router.post('/collect-data', authenticate, async (req: Request, res: Response) => {
  try {
    const { phoneNumber, facilityId, dataType } = req.body;
    
    const dataCollectionPrompts = {
      system_status: "Please reply with your system status:\n1. Working normally\n2. Partially working\n3. Not working\n4. Unknown",
      power_output: "Please check your system display and reply with:\n- Current power output (in kW)\n- Battery percentage\n- Any error messages",
      maintenance_request: "To request maintenance, please provide:\n1. Issue description\n2. Urgency (1-5 scale)\n3. Best contact time\n4. Location details",
      performance_feedback: "Rate your system performance this week:\n1. Excellent\n2. Good\n3. Average\n4. Poor\n5. Very poor\n\nAny specific concerns?"
    };

    const prompt = dataCollectionPrompts[dataType as keyof typeof dataCollectionPrompts];
    if (!prompt) {
      return res.status(400).json({ error: 'Invalid data collection type' });
    }

    await sendWhatsAppMessage(phoneNumber, prompt);
    
    // Log data collection request
    await WhatsApp.create({
      facilityId,
      phoneNumber,
      message: `Data collection initiated: ${dataType}`,
      direction: 'out',
      status: 'sent',
    });

    res.json({ success: true, message: 'Data collection initiated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to initiate data collection' });
  }
});

// Send maintenance instructions
router.post('/maintenance-instructions', authenticate, async (req: Request, res: Response) => {
  try {
    const { phoneNumber, facilityId, instructionType, customInstructions } = req.body;

    const instructions = {
      battery_check: "🔋 BATTERY MAINTENANCE:\n1. Check battery terminals for corrosion\n2. Verify battery voltage (should be 12.6V+)\n3. Clean terminals if needed\n4. Report any swelling or leaks\n5. Reply 'BATTERY_DONE' when complete",
      
      panel_cleaning: "☀️ PANEL CLEANING:\n1. Turn off system\n2. Use soft brush & clean water\n3. Clean in early morning/evening\n4. Check for cracks or damage\n5. Turn system back on\n6. Reply 'PANELS_DONE' when complete",
      
      inverter_check: "⚡ INVERTER INSPECTION:\n1. Check display for error codes\n2. Listen for unusual sounds\n3. Verify LED status lights\n4. Check ventilation is clear\n5. Note any error codes\n6. Reply with findings",
      
      system_restart: "🔄 SYSTEM RESTART:\n1. Turn off AC disconnect\n2. Turn off DC disconnect\n3. Wait 5 minutes\n4. Turn on DC disconnect\n5. Turn on AC disconnect\n6. Monitor for 10 minutes\n7. Reply 'RESTART_DONE' with status",
      
      troubleshooting: "🔧 TROUBLESHOOTING:\n1. Check all connections\n2. Verify breaker positions\n3. Note any error messages\n4. Check system monitoring display\n5. Take photos if safe to do so\n6. Reply with findings"
    };

    const instruction = customInstructions || instructions[instructionType as keyof typeof instructions];
    if (!instruction) {
      return res.status(400).json({ error: 'Invalid instruction type' });
    }

    await sendWhatsAppMessage(phoneNumber, instruction);
    
    // Log instruction delivery
    await WhatsApp.create({
      facilityId,
      phoneNumber,
      message: `Maintenance instructions sent: ${instructionType}`,
      direction: 'out',
      status: 'sent',
    });

    res.json({ success: true, message: 'Instructions sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send instructions' });
  }
});

// Analytics endpoint
router.get('/analytics', authenticate, async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    
    // Get message statistics
    const totalMessages = await WhatsApp.count({
      where: from && to ? {
        createdAt: {
          [Op.gte]: new Date(from as string),
          [Op.lte]: new Date(to as string)
        }
      } : {}
    });

    const issuesReported = await WhatsApp.count({
      where: {
        message: {
          [Op.or]: [
            { [Op.iLike]: '%not working%' },
            { [Op.iLike]: '%problem%' },
            { [Op.iLike]: '%issue%' },
            { [Op.iLike]: '%help%' }
          ]
        }
      }
    });

    // Mock analytics data
    const analytics = {
      totalMessages,
      activeChats: Math.floor(totalMessages * 0.3),
      issuesReported,
      avgResponseTime: 2.3,
      topIssues: [
        { issue: 'Battery not charging', count: 12, avgResolutionTime: 4.5 },
        { issue: 'Low power output', count: 8, avgResolutionTime: 3.2 },
        { issue: 'System offline', count: 6, avgResolutionTime: 1.8 }
      ],
      responseTimeMetrics: {
        under1Hour: 65,
        under4Hours: 25,
        under24Hours: 8,
        over24Hours: 2
      },
      supportTicketsGenerated: issuesReported,
      customerSatisfaction: 4.2
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Helper function to process incoming messages
async function processIncomingMessage(message: string, phoneNumber: string) {
  const lowerMessage = message.toLowerCase();
  
  // Check for completion confirmations
  if (lowerMessage.includes('_done')) {
    await sendWhatsAppMessage(phoneNumber, "✅ Thank you for completing the maintenance task. The information has been logged and our team will follow up if needed.");
    return;
  }

  // Enhanced issue detection
  const issuePatterns = {
    'battery': 'battery_issue',
    'inverter': 'inverter_issue', 
    'panel': 'panel_issue',
    'not working': 'system_fault',
    'no power': 'power_issue',
    'error': 'error_code',
    'maintenance': 'maintenance_request',
    'help': 'general_support'
  };

  // Detect issue type
  let detectedIssue = 'general_inquiry';
  for (const [pattern, issueType] of Object.entries(issuePatterns)) {
    if (lowerMessage.includes(pattern)) {
      detectedIssue = issueType;
      break;
    }
  }

  // Send appropriate response and collect structured data
  await sendStructuredResponse(detectedIssue, phoneNumber, message);
}

// Enhanced structured response system
async function sendStructuredResponse(issueType: string, phoneNumber: string, originalMessage: string) {
  const responses = {
    battery_issue: {
      message: "🔋 Battery Issue Detected\nI'll help you troubleshoot this. Please provide:\n\n1. Battery percentage (if visible)\n2. Any warning lights on battery\n3. How long has this issue persisted?\n\nReply with numbers 1-3 followed by your answers.",
      followUp: true
    },
    inverter_issue: {
      message: "⚡ Inverter Issue Detected\nLet me guide you through this:\n\n1. Check inverter display - any error codes?\n2. Is the inverter making any sounds?\n3. When did you first notice this?\n\nPlease reply with the error code if visible.",
      followUp: true
    },
    system_fault: {
      message: "⚠️ System Fault Reported\nI'm creating a priority support ticket. Please confirm:\n\n1. Is the system completely off? (Yes/No)\n2. When did it stop working?\n3. Any recent weather events?\n\nOur technician will contact you within 2 hours.",
      followUp: true
    },
    maintenance_request: {
      message: "🔧 Maintenance Request\nI'll schedule this for you. Please specify:\n\n1. Routine maintenance or specific issue?\n2. Preferred time (morning/afternoon)\n3. Urgency level (1-5, where 5 is urgent)\n\nReply with your preferences.",
      followUp: true
    },
    general_support: {
      message: "👋 Hello! I'm here to help with your solar system.\n\nCommon services:\n• System status check\n• Maintenance scheduling\n• Troubleshooting assistance\n• Performance monitoring\n\nWhat can I help you with today?",
      followUp: false
    }
  };

  const response = responses[issueType as keyof typeof responses] || responses.general_support;
  await sendWhatsAppMessage(phoneNumber, response.message);
}

// Helper function to send WhatsApp messages
async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  try {
    await axios.post(`${WHATSAPP_API_URL}/v1/messages`, {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: { body: message },
    }, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    throw error;
  }
}

// Send automated response based on issue type
async function sendAutomatedResponse(issueType: string, phoneNumber: string) {
  const responses = {
    system_fault: 'We received your report about the system not working. Our team will contact you shortly to assist with the issue.',
    battery_low: 'Your battery level is low. Please check if the PV panels are clean and not obstructed. We recommend a maintenance check.',
    inverter_issue: 'We received your inverter-related issue. Please check the inverter display for error codes and contact us for further assistance.',
    panel_issue: 'We received your PV panel issue. Please check for any visible damage or shading on the panels. We recommend a maintenance check.',
    performance_issue: 'We received your performance concern. Please provide more details about the specific issue you are experiencing.',
  };

  const response = responses[issueType as keyof typeof responses];
  if (response) {
    await axios.post(`${WHATSAPP_API_URL}/v1/messages`, {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: { body: response },
    }, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
  }
}

export default router;
