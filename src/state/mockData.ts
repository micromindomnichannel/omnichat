export type Vertical = 'commerce' | 'appointments';

export type Channel = 'instagram' | 'whatsapp' | 'facebook' | 'tiktok' | 'website';

export interface Customer {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  channels: Channel[];
  customerSince: string;
  tags: string[];
  status: 'New' | 'Returning' | 'VIP';
  totalSpent: number;
  totalOrders: number;
  totalAppointments: number;
  reliability: {
    status: 'Good' | 'Fair' | 'Watch';
    completed: number;
    cancellations: number;
    returns: number;
    noShows: number;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'customer' | 'ai' | 'human' | 'system';
  content: string;
  timestamp: string;
  agentName?: string;
  isArabic?: boolean;
  mediaUrl?: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  channel: Channel;
  status: 'ai_handling' | 'human' | 'unread' | 'resolved' | 'escalated';
  intent: 'purchase' | 'booking' | 'browsing' | 'support';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  aiContext: {
    intent: string;
    stage: string;
    aiStatus: string;
    toolsUsed: string[];
  };
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  image: string;
  variants: { name: string; available: boolean }[];
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category: string;
  description: string;
  image?: string;
  availability: { day: string; start: string; end: string; available: boolean }[];
}

export interface Order {
  id: string;
  customerId: string;
  productId: string;
  productName: string;
  variant?: string;
  quantity: number;
  total: number;
  status: 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  paymentMethod: 'COD' | 'Card';
  governorate: string;
  address: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  serviceId: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'Confirmed' | 'Completed' | 'No-show' | 'Cancelled';
  duration: number;
}

export interface Automation {
  id: string;
  name: string;
  active: boolean;
  steps: string[];
  vertical: Vertical;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  vertical: Vertical;
}

export interface Source {
  id: string;
  name: string;
  type: 'PDF' | 'DOCX' | 'Image' | 'Text' | 'URL';
  inUse: boolean;
}

export interface FollowUp {
  id: string;
  customerId: string;
  context: string;
  scheduledTime: string;
  status: 'pending' | 'sent' | 'paused';
  vertical: Vertical;
  message: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Agent' | 'Viewer';
  status: 'Active' | 'Pending';
}

export interface NotificationSetting {
  event: string;
  email: boolean;
  inApp: boolean;
}

export const EGYPTIAN_GOVERNORATES = [
  'Cairo', 'Alexandria', 'Giza', 'Qalyubia', 'Monufia', 'Gharbia', 'Dakahlia',
  'Sharqia', 'Beheira', 'Kafr El Sheikh', 'Damietta', 'Port Said', 'Ismailia',
  'Suez', 'North Sinai', 'South Sinai', 'Red Sea', 'New Valley', 'Matruh',
  'Faiyum', 'Beni Suef', 'Minya', 'Asyut', 'Sohag', 'Qena', 'Luxor', 'Aswan'
];

export const CHANNEL_COLORS: Record<Channel, string> = {
  instagram: '#E4405F',
  whatsapp: '#25D366',
  facebook: '#1877F2',
  tiktok: '#000000',
  website: '#6B7280'
};

export const CHANNEL_NAMES: Record<Channel, string> = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  website: 'Website'
};

// Egyptian names for realism
const EGYPTIAN_NAMES = [
  'Ahmed Hassan', 'Mohamed Ali', 'Fatima Zahra', 'Omar Khalil', 'Nour El-Din',
  'Samar Ibrahim', 'Khaled Mostafa', 'Hana Saeed', 'Youssef Farouk', 'Layla Mahmoud',
  'Tarek El-Sayed', 'Rania Nabil', 'Hossam Fathy', 'Dina Kamel', 'Amr Diab'
];

const AVATAR_COLORS = ['#2F5CFF', '#0F9D77', '#E4405F', '#B25E09', '#12875A', '#7C3AED'];

export function getAvatar(name: string) {
  const initial = name.charAt(0);
  const color = AVATAR_COLORS[name.length % AVATAR_COLORS.length];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color.replace('#', '')}&color=fff&size=128`;
}

export const customers: Customer[] = [
  {
    id: 'c1',
    name: 'Ahmed Hassan',
    avatar: getAvatar('Ahmed Hassan'),
    phone: '0102 345 6789',
    channels: ['instagram', 'whatsapp'],
    customerSince: '2024-01-15',
    tags: ['VIP', 'Returning'],
    status: 'VIP',
    totalSpent: 12500,
    totalOrders: 5,
    totalAppointments: 0,
    reliability: { status: 'Good', completed: 5, cancellations: 0, returns: 0, noShows: 0 }
  },
  {
    id: 'c2',
    name: 'Fatima Zahra',
    avatar: getAvatar('Fatima Zahra'),
    phone: '0111 234 5678',
    channels: ['whatsapp', 'facebook'],
    customerSince: '2024-03-20',
    tags: ['New'],
    status: 'New',
    totalSpent: 0,
    totalOrders: 0,
    totalAppointments: 0,
    reliability: { status: 'Good', completed: 0, cancellations: 0, returns: 0, noShows: 0 }
  },
  {
    id: 'c3',
    name: 'Mohamed Ali',
    avatar: getAvatar('Mohamed Ali'),
    phone: '0122 345 6789',
    channels: ['instagram'],
    customerSince: '2024-02-10',
    tags: ['Returning'],
    status: 'Returning',
    totalSpent: 3200,
    totalOrders: 2,
    totalAppointments: 0,
    reliability: { status: 'Fair', completed: 2, cancellations: 1, returns: 0, noShows: 0 }
  },
  {
    id: 'c4',
    name: 'Omar Khalil',
    avatar: getAvatar('Omar Khalil'),
    phone: '0100 987 6543',
    channels: ['tiktok', 'website'],
    customerSince: '2024-06-01',
    tags: ['New'],
    status: 'New',
    totalSpent: 0,
    totalOrders: 0,
    totalAppointments: 0,
    reliability: { status: 'Good', completed: 0, cancellations: 0, returns: 0, noShows: 0 }
  },
  {
    id: 'c5',
    name: 'Samar Ibrahim',
    avatar: getAvatar('Samar Ibrahim'),
    phone: '0155 444 3333',
    channels: ['facebook', 'whatsapp'],
    customerSince: '2023-11-20',
    tags: ['VIP', 'Returning'],
    status: 'VIP',
    totalSpent: 8900,
    totalOrders: 4,
    totalAppointments: 0,
    reliability: { status: 'Good', completed: 4, cancellations: 0, returns: 0, noShows: 0 }
  },
  {
    id: 'c6',
    name: 'Khaled Mostafa',
    avatar: getAvatar('Khaled Mostafa'),
    phone: '0103 222 1111',
    channels: ['website'],
    customerSince: '2024-04-15',
    tags: ['New'],
    status: 'New',
    totalSpent: 0,
    totalOrders: 0,
    totalAppointments: 0,
    reliability: { status: 'Watch', completed: 1, cancellations: 2, returns: 1, noShows: 0 }
  },
  {
    id: 'c7',
    name: 'Hana Saeed',
    avatar: getAvatar('Hana Saeed'),
    phone: '0128 777 8888',
    channels: ['instagram', 'whatsapp', 'facebook'],
    customerSince: '2024-01-05',
    tags: ['Returning'],
    status: 'Returning',
    totalSpent: 5600,
    totalOrders: 3,
    totalAppointments: 0,
    reliability: { status: 'Good', completed: 3, cancellations: 0, returns: 0, noShows: 0 }
  },
  {
    id: 'c8',
    name: 'Youssef Farouk',
    avatar: getAvatar('Youssef Farouk'),
    phone: '0105 666 5555',
    channels: ['whatsapp'],
    customerSince: '2024-05-20',
    tags: ['New'],
    status: 'New',
    totalSpent: 0,
    totalOrders: 0,
    totalAppointments: 0,
    reliability: { status: 'Good', completed: 0, cancellations: 0, returns: 0, noShows: 0 }
  },
  {
    id: 'c9',
    name: 'Layla Mahmoud',
    avatar: getAvatar('Layla Mahmoud'),
    phone: '0114 333 2222',
    channels: ['tiktok'],
    customerSince: '2024-07-01',
    tags: ['New'],
    status: 'New',
    totalSpent: 0,
    totalOrders: 0,
    totalAppointments: 0,
    reliability: { status: 'Good', completed: 0, cancellations: 0, returns: 0, noShows: 0 }
  },
  {
    id: 'c10',
    name: 'Tarek El-Sayed',
    avatar: getAvatar('Tarek El-Sayed'),
    phone: '0120 999 0000',
    channels: ['facebook', 'website'],
    customerSince: '2024-02-28',
    tags: ['Returning'],
    status: 'Returning',
    totalSpent: 1800,
    totalOrders: 1,
    totalAppointments: 0,
    reliability: { status: 'Fair', completed: 1, cancellations: 1, returns: 0, noShows: 0 }
  }
];

export const conversations: Conversation[] = [
  {
    id: 'conv1',
    customerId: 'c1',
    channel: 'instagram',
    status: 'ai_handling',
    intent: 'purchase',
    lastMessage: 'هو الشنطة دي بكام؟',
    lastMessageTime: '2 min ago',
    unreadCount: 0,
    aiContext: {
      intent: 'High purchase intent',
      stage: 'Order collection',
      aiStatus: 'Handling automatically',
      toolsUsed: ['Product catalog', 'Inventory']
    }
  },
  {
    id: 'conv2',
    customerId: 'c2',
    channel: 'whatsapp',
    status: 'human',
    intent: 'booking',
    lastMessage: 'عايز أحجز كشف يوم الخميس',
    lastMessageTime: '5 min ago',
    unreadCount: 0,
    aiContext: {
      intent: 'Booking intent',
      stage: 'Availability check',
      aiStatus: 'Escalated',
      toolsUsed: ['Service list', 'Availability calendar']
    }
  },
  {
    id: 'conv3',
    customerId: 'c3',
    channel: 'facebook',
    status: 'unread',
    intent: 'support',
    lastMessage: 'ممكن أعرف لو المقاس L موجود؟',
    lastMessageTime: '12 min ago',
    unreadCount: 3,
    aiContext: {
      intent: 'Browsing',
      stage: 'Qualification',
      aiStatus: 'Waiting on customer',
      toolsUsed: ['Product catalog']
    }
  },
  {
    id: 'conv4',
    customerId: 'c4',
    channel: 'tiktok',
    status: 'ai_handling',
    intent: 'purchase',
    lastMessage: 'Is this available in black?',
    lastMessageTime: '18 min ago',
    unreadCount: 0,
    aiContext: {
      intent: 'High purchase intent',
      stage: 'Availability check',
      aiStatus: 'Handling automatically',
      toolsUsed: ['Product catalog', 'Inventory']
    }
  },
  {
    id: 'conv5',
    customerId: 'c5',
    channel: 'whatsapp',
    status: 'resolved',
    intent: 'purchase',
    lastMessage: 'Thank you! Order received.',
    lastMessageTime: '1 hour ago',
    unreadCount: 0,
    aiContext: {
      intent: 'High purchase intent',
      stage: 'Order collection',
      aiStatus: 'Resolved',
      toolsUsed: ['Product catalog', 'Inventory', 'Order creation']
    }
  },
  {
    id: 'conv6',
    customerId: 'c6',
    channel: 'website',
    status: 'escalated',
    intent: 'support',
    lastMessage: 'I want to speak to a manager',
    lastMessageTime: '25 min ago',
    unreadCount: 2,
    aiContext: {
      intent: 'Support',
      stage: 'Escalation',
      aiStatus: 'Escalated',
      toolsUsed: []
    }
  },
  {
    id: 'conv7',
    customerId: 'c7',
    channel: 'instagram',
    status: 'ai_handling',
    intent: 'booking',
    lastMessage: 'What time slots do you have for tomorrow?',
    lastMessageTime: '32 min ago',
    unreadCount: 0,
    aiContext: {
      intent: 'Booking intent',
      stage: 'Availability check',
      aiStatus: 'Handling automatically',
      toolsUsed: ['Service list', 'Availability calendar']
    }
  },
  {
    id: 'conv8',
    customerId: 'c8',
    channel: 'whatsapp',
    status: 'unread',
    intent: 'purchase',
    lastMessage: 'Do you deliver to Alexandria?',
    lastMessageTime: '45 min ago',
    unreadCount: 1,
    aiContext: {
      intent: 'Browsing',
      stage: 'Qualification',
      aiStatus: 'Waiting on customer',
      toolsUsed: ['Product catalog']
    }
  },
  {
    id: 'conv9',
    customerId: 'c9',
    channel: 'tiktok',
    status: 'human',
    intent: 'purchase',
    lastMessage: 'Can I get a discount?',
    lastMessageTime: '1 hour ago',
    unreadCount: 0,
    aiContext: {
      intent: 'High purchase intent',
      stage: 'Order collection',
      aiStatus: 'Escalated',
      toolsUsed: ['Product catalog']
    }
  },
  {
    id: 'conv10',
    customerId: 'c10',
    channel: 'facebook',
    status: 'ai_handling',
    intent: 'booking',
    lastMessage: 'I need to reschedule my appointment',
    lastMessageTime: '2 hours ago',
    unreadCount: 0,
    aiContext: {
      intent: 'Booking intent',
      stage: 'Availability check',
      aiStatus: 'Handling automatically',
      toolsUsed: ['Service list', 'Availability calendar']
    }
  },
  {
    id: 'conv11',
    customerId: 'c1',
    channel: 'whatsapp',
    status: 'unread',
    intent: 'purchase',
    lastMessage: 'Thanks for the quick response!',
    lastMessageTime: '3 hours ago',
    unreadCount: 1,
    aiContext: {
      intent: 'High purchase intent',
      stage: 'Order collection',
      aiStatus: 'Waiting on customer',
      toolsUsed: ['Product catalog', 'Inventory']
    }
  },
  {
    id: 'conv12',
    customerId: 'c3',
    channel: 'instagram',
    status: 'resolved',
    intent: 'purchase',
    lastMessage: 'Perfect, order confirmed!',
    lastMessageTime: '5 hours ago',
    unreadCount: 0,
    aiContext: {
      intent: 'High purchase intent',
      stage: 'Order collection',
      aiStatus: 'Resolved',
      toolsUsed: ['Product catalog', 'Inventory', 'Order creation']
    }
  },
  {
    id: 'conv13',
    customerId: 'c5',
    channel: 'website',
    status: 'ai_handling',
    intent: 'booking',
    lastMessage: 'What services do you offer?',
    lastMessageTime: '6 hours ago',
    unreadCount: 0,
    aiContext: {
      intent: 'Booking intent',
      stage: 'Qualification',
      aiStatus: 'Handling automatically',
      toolsUsed: ['Service list']
    }
  },
  {
    id: 'conv14',
    customerId: 'c7',
    channel: 'facebook',
    status: 'unread',
    intent: 'support',
    lastMessage: 'How do I track my order?',
    lastMessageTime: '8 hours ago',
    unreadCount: 2,
    aiContext: {
      intent: 'Browsing',
      stage: 'Qualification',
      aiStatus: 'Waiting on customer',
      toolsUsed: ['Product catalog']
    }
  }
];

export const messages: Record<string, Message[]> = {
  conv1: [
    { id: 'm1', conversationId: 'conv1', sender: 'customer', content: 'هو الشنطة دي بكام؟', timestamp: '10:00 AM', isArabic: true },
    { id: 'm2', conversationId: 'conv1', sender: 'ai', content: 'The Black Leather Bag is priced at 850 EGP. Would you like me to check availability for you?', timestamp: '10:01 AM' },
    { id: 'm3', conversationId: 'conv1', sender: 'system', content: 'AI checked product availability', timestamp: '10:01 AM' },
    { id: 'm4', conversationId: 'conv1', sender: 'ai', content: "Yes, it's in stock! All sizes (S, M, L) are available. Shall I create an order for you?", timestamp: '10:02 AM' },
    { id: 'm5', conversationId: 'conv1', sender: 'customer', content: 'Yes please, I want size M', timestamp: '10:03 AM' },
    { id: 'm6', conversationId: 'conv1', sender: 'ai', content: "Great choice! To complete your order, I'll need your name, phone number, and delivery address.", timestamp: '10:03 AM' }
  ],
  conv2: [
    { id: 'm1', conversationId: 'conv2', sender: 'customer', content: 'عايز أحجز كشف يوم الخميس', timestamp: '9:30 AM', isArabic: true },
    { id: 'm2', conversationId: 'conv2', sender: 'ai', content: "I'd be happy to help you book a dental checkup for Thursday. Let me check availability.", timestamp: '9:31 AM' },
    { id: 'm3', conversationId: 'conv2', sender: 'system', content: 'AI checked availability calendar', timestamp: '9:31 AM' },
    { id: 'm4', conversationId: 'conv2', sender: 'ai', content: 'We have slots at 09:30, 11:00, 13:30, and 16:00. Which time works best for you?', timestamp: '9:32 AM' },
    { id: 'm5', conversationId: 'conv2', sender: 'customer', content: '11:00 would be perfect', timestamp: '9:33 AM' },
    { id: 'm6', conversationId: 'conv2', sender: 'human', content: "I'll help you finalize this booking. Can you confirm your full name and phone number?", timestamp: '9:35 AM', agentName: 'Agent' }
  ],
  conv3: [
    { id: 'm1', conversationId: 'conv3', sender: 'customer', content: 'ممكن أعرف لو المقاس L موجود؟', timestamp: '9:15 AM', isArabic: true },
    { id: 'm2', conversationId: 'conv3', sender: 'ai', content: 'Let me check the inventory for you.', timestamp: '9:16 AM' },
    { id: 'm3', conversationId: 'conv3', sender: 'system', content: 'AI checked product availability', timestamp: '9:16 AM' },
    { id: 'm4', conversationId: 'conv3', sender: 'ai', content: 'Yes, size L is available! We have 8 units in stock. Would you like to place an order?', timestamp: '9:17 AM' }
  ],
  conv4: [
    { id: 'm1', conversationId: 'conv4', sender: 'customer', content: 'Is this available in black?', timestamp: '9:00 AM' },
    { id: 'm2', conversationId: 'conv4', sender: 'ai', content: "Yes, the Classic T-Shirt is available in black. It's 320 EGP. Should I check stock?", timestamp: '9:01 AM' },
    { id: 'm3', conversationId: 'conv4', sender: 'system', content: 'AI checked product availability', timestamp: '9:01 AM' },
    { id: 'm4', conversationId: 'conv4', sender: 'ai', content: 'We have 15 units in black. Would you like to proceed with an order?', timestamp: '9:02 AM' }
  ],
  conv5: [
    { id: 'm1', conversationId: 'conv5', sender: 'customer', content: "I'd like to order the running shoes", timestamp: '8:30 AM' },
    { id: 'm2', conversationId: 'conv5', sender: 'ai', content: 'The Nike Running Shoes are 1,200 EGP. What size do you need?', timestamp: '8:31 AM' },
    { id: 'm3', conversationId: 'conv5', sender: 'customer', content: 'Size 42', timestamp: '8:32 AM' },
    { id: 'm4', conversationId: 'conv5', sender: 'system', content: 'AI checked product availability', timestamp: '8:32 AM' },
    { id: 'm5', conversationId: 'conv5', sender: 'ai', content: "Perfect! Size 42 is available. I'll create the order for you.", timestamp: '8:33 AM' },
    { id: 'm6', conversationId: 'conv5', sender: 'system', content: 'Order #1048 created successfully', timestamp: '8:34 AM' },
    { id: 'm7', conversationId: 'conv5', sender: 'ai', content: "Your order #1048 has been created! Total: 1,200 EGP. Cash on delivery. You'll receive a confirmation shortly.", timestamp: '8:34 AM' },
    { id: 'm8', conversationId: 'conv5', sender: 'customer', content: 'Thank you! Order received.', timestamp: '8:35 AM' }
  ],
  conv6: [
    { id: 'm1', conversationId: 'conv6', sender: 'customer', content: 'I want to speak to a manager', timestamp: '8:15 AM' },
    { id: 'm2', conversationId: 'conv6', sender: 'ai', content: "I understand you'd like to speak with a manager. I'm connecting you to a human agent now.", timestamp: '8:16 AM' },
    { id: 'm3', conversationId: 'conv6', sender: 'system', content: 'AI escalated conversation to human agent', timestamp: '8:16 AM' }
  ],
  conv7: [
    { id: 'm1', conversationId: 'conv7', sender: 'customer', content: 'What time slots do you have for tomorrow?', timestamp: '8:00 AM' },
    { id: 'm2', conversationId: 'conv7', sender: 'ai', content: 'For tomorrow, we have availability for Dental Cleaning, Teeth Whitening, and Consultation. Which service are you interested in?', timestamp: '8:01 AM' },
    { id: 'm3', conversationId: 'conv7', sender: 'customer', content: 'Dental cleaning', timestamp: '8:02 AM' },
    { id: 'm4', conversationId: 'conv7', sender: 'system', content: 'AI checked availability calendar', timestamp: '8:02 AM' },
    { id: 'm5', conversationId: 'conv7', sender: 'ai', content: 'We have slots at 09:30, 11:00, 13:30, and 16:00 for Dental Cleaning (45 min, from 600 EGP). Which time works for you?', timestamp: '8:03 AM' }
  ],
  conv8: [
    { id: 'm1', conversationId: 'conv8', sender: 'customer', content: 'Do you deliver to Alexandria?', timestamp: '7:45 AM' },
    { id: 'm2', conversationId: 'conv8', sender: 'ai', content: 'Yes, we deliver to Alexandria! Delivery fee is 50 EGP. Orders over 1,000 EGP get free delivery.', timestamp: '7:46 AM' }
  ],
  conv9: [
    { id: 'm1', conversationId: 'conv9', sender: 'customer', content: 'Can I get a discount?', timestamp: '7:30 AM' },
    { id: 'm2', conversationId: 'conv9', sender: 'ai', content: 'I can offer you a 10% discount on orders over 500 EGP. Would you like to see our current promotions?', timestamp: '7:31 AM' },
    { id: 'm3', conversationId: 'conv9', sender: 'human', content: 'I can apply a special 15% discount for you. What items are you interested in?', timestamp: '7:35 AM', agentName: 'Agent' }
  ],
  conv10: [
    { id: 'm1', conversationId: 'conv10', sender: 'customer', content: 'I need to reschedule my appointment', timestamp: '7:00 AM' },
    { id: 'm2', conversationId: 'conv10', sender: 'ai', content: 'I can help you reschedule. Your current appointment is for Teeth Whitening on Aug 18 at 14:00. What date would you prefer?', timestamp: '7:01 AM' }
  ],
  conv11: [
    { id: 'm1', conversationId: 'conv11', sender: 'customer', content: 'Thanks for the quick response!', timestamp: '6:30 AM' },
    { id: 'm2', conversationId: 'conv11', sender: 'ai', content: "You're welcome! Is there anything else I can help you with today?", timestamp: '6:31 AM' }
  ],
  conv12: [
    { id: 'm1', conversationId: 'conv12', sender: 'customer', content: 'I want to buy the leather wallet', timestamp: '5:00 AM' },
    { id: 'm2', conversationId: 'conv12', sender: 'ai', content: 'The Leather Wallet is 450 EGP. Checking availability...', timestamp: '5:01 AM' },
    { id: 'm3', conversationId: 'conv12', sender: 'system', content: 'AI checked product availability', timestamp: '5:01 AM' },
    { id: 'm4', conversationId: 'conv12', sender: 'ai', content: "It's in stock! Shall I create the order?", timestamp: '5:02 AM' },
    { id: 'm5', conversationId: 'conv12', sender: 'customer', content: 'Yes', timestamp: '5:03 AM' },
    { id: 'm6', conversationId: 'conv12', sender: 'system', content: 'Order #1049 created successfully', timestamp: '5:04 AM' },
    { id: 'm7', conversationId: 'conv12', sender: 'ai', content: 'Perfect, order confirmed! Order #1049. Total: 450 EGP.', timestamp: '5:04 AM' },
    { id: 'm8', conversationId: 'conv12', sender: 'customer', content: 'Perfect, order confirmed!', timestamp: '5:05 AM' }
  ],
  conv13: [
    { id: 'm1', conversationId: 'conv13', sender: 'customer', content: 'What services do you offer?', timestamp: '4:30 AM' },
    { id: 'm2', conversationId: 'conv13', sender: 'ai', content: 'We offer Dental Cleaning (from 600 EGP, 45 min), Teeth Whitening (from 1,500 EGP, 60 min), and Consultation (300 EGP, 30 min). Which service interests you?', timestamp: '4:31 AM' }
  ],
  conv14: [
    { id: 'm1', conversationId: 'conv14', sender: 'customer', content: 'How do I track my order?', timestamp: '3:00 AM' },
    { id: 'm2', conversationId: 'conv14', sender: 'ai', content: 'You can track your order using the tracking number sent to your WhatsApp. Would you like me to resend it?', timestamp: '3:01 AM' }
  ]
};

export const products: Product[] = [
  {
    id: 'p1',
    name: 'Black Leather Bag',
    sku: 'BLB-001',
    price: 850,
    stock: 12,
    category: 'Bags',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop',
    variants: [
      { name: 'Small', available: true },
      { name: 'Medium', available: true },
      { name: 'Large', available: false }
    ]
  },
  {
    id: 'p2',
    name: 'Classic T-Shirt',
    sku: 'CTS-002',
    price: 320,
    stock: 45,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop',
    variants: [
      { name: 'S', available: true },
      { name: 'M', available: true },
      { name: 'L', available: true },
      { name: 'XL', available: false }
    ]
  },
  {
    id: 'p3',
    name: 'Nike Running Shoes',
    sku: 'NRS-003',
    price: 1200,
    stock: 8,
    category: 'Shoes',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop',
    variants: [
      { name: '40', available: true },
      { name: '41', available: true },
      { name: '42', available: true },
      { name: '43', available: false }
    ]
  },
  {
    id: 'p4',
    name: 'Leather Wallet',
    sku: 'LW-004',
    price: 450,
    stock: 3,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop',
    variants: [
      { name: 'Brown', available: true },
      { name: 'Black', available: true }
    ]
  },
  {
    id: 'p5',
    name: 'Cotton Hoodie',
    sku: 'CH-005',
    price: 650,
    stock: 0,
    category: 'Clothing',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop',
    variants: [
      { name: 'S', available: false },
      { name: 'M', available: false },
      { name: 'L', available: false }
    ]
  },
  {
    id: 'p6',
    name: 'Sunglasses',
    sku: 'SG-006',
    price: 280,
    stock: 20,
    category: 'Accessories',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
    variants: [
      { name: 'Black', available: true },
      { name: 'Brown', available: true }
    ]
  }
];

export const services: Service[] = [
  {
    id: 's1',
    name: 'Dental Cleaning',
    price: 600,
    duration: 45,
    category: 'General',
    description: 'Professional dental cleaning and plaque removal',
    availability: [
      { day: 'Saturday', start: '09:00', end: '17:00', available: true },
      { day: 'Sunday', start: '09:00', end: '17:00', available: true },
      { day: 'Monday', start: '09:00', end: '17:00', available: true },
      { day: 'Tuesday', start: '09:00', end: '17:00', available: true },
      { day: 'Wednesday', start: '09:00', end: '17:00', available: true },
      { day: 'Thursday', start: '09:00', end: '17:00', available: true },
      { day: 'Friday', start: '09:00', end: '14:00', available: false }
    ]
  },
  {
    id: 's2',
    name: 'Teeth Whitening',
    price: 1500,
    duration: 60,
    category: 'Cosmetic',
    description: 'Professional teeth whitening treatment',
    availability: [
      { day: 'Saturday', start: '10:00', end: '16:00', available: true },
      { day: 'Sunday', start: '10:00', end: '16:00', available: true },
      { day: 'Monday', start: '10:00', end: '16:00', available: true },
      { day: 'Tuesday', start: '10:00', end: '16:00', available: true },
      { day: 'Wednesday', start: '10:00', end: '16:00', available: true },
      { day: 'Thursday', start: '10:00', end: '16:00', available: true },
      { day: 'Friday', start: '10:00', end: '14:00', available: false }
    ]
  },
  {
    id: 's3',
    name: 'Consultation',
    price: 300,
    duration: 30,
    category: 'General',
    description: 'Initial dental consultation and assessment',
    availability: [
      { day: 'Saturday', start: '09:00', end: '18:00', available: true },
      { day: 'Sunday', start: '09:00', end: '18:00', available: true },
      { day: 'Monday', start: '09:00', end: '18:00', available: true },
      { day: 'Tuesday', start: '09:00', end: '18:00', available: true },
      { day: 'Wednesday', start: '09:00', end: '18:00', available: true },
      { day: 'Thursday', start: '09:00', end: '18:00', available: true },
      { day: 'Friday', start: '09:00', end: '14:00', available: false }
    ]
  }
];

export const orders: Order[] = [
  {
    id: '1045',
    customerId: 'c1',
    productId: 'p1',
    productName: 'Black Leather Bag',
    variant: 'Medium',
    quantity: 1,
    total: 850,
    status: 'Delivered',
    date: '2024-08-10',
    paymentMethod: 'COD',
    governorate: 'Cairo',
    address: '15 Ramses Street, Downtown'
  },
  {
    id: '1046',
    customerId: 'c3',
    productId: 'p2',
    productName: 'Classic T-Shirt',
    variant: 'L',
    quantity: 2,
    total: 640,
    status: 'Shipped',
    date: '2024-08-14',
    paymentMethod: 'COD',
    governorate: 'Alexandria',
    address: '42 Corniche Road'
  },
  {
    id: '1047',
    customerId: 'c5',
    productId: 'p3',
    productName: 'Nike Running Shoes',
    variant: '42',
    quantity: 1,
    total: 1200,
    status: 'Processing',
    date: '2024-08-16',
    paymentMethod: 'COD',
    governorate: 'Giza',
    address: '78 Haram Street'
  },
  {
    id: '1048',
    customerId: 'c5',
    productId: 'p3',
    productName: 'Nike Running Shoes',
    variant: '41',
    quantity: 1,
    total: 1200,
    status: 'Confirmed',
    date: '2024-08-17',
    paymentMethod: 'COD',
    governorate: 'Giza',
    address: '78 Haram Street'
  },
  {
    id: '1049',
    customerId: 'c3',
    productId: 'p4',
    productName: 'Leather Wallet',
    variant: 'Brown',
    quantity: 1,
    total: 450,
    status: 'Confirmed',
    date: '2024-08-17',
    paymentMethod: 'COD',
    governorate: 'Cairo',
    address: '22 Tahrir Square'
  }
];

export const appointments: Appointment[] = [
  {
    id: 'A-101',
    customerId: 'c2',
    serviceId: 's1',
    serviceName: 'Dental Cleaning',
    date: '2024-08-17',
    time: '09:30',
    status: 'Confirmed',
    duration: 45
  },
  {
    id: 'A-102',
    customerId: 'c7',
    serviceId: 's2',
    serviceName: 'Teeth Whitening',
    date: '2024-08-17',
    time: '11:00',
    status: 'Confirmed',
    duration: 60
  },
  {
    id: 'A-103',
    customerId: 'c5',
    serviceId: 's3',
    serviceName: 'Consultation',
    date: '2024-08-17',
    time: '13:30',
    status: 'Confirmed',
    duration: 30
  },
  {
    id: 'A-104',
    customerId: 'c1',
    serviceId: 's1',
    serviceName: 'Dental Cleaning',
    date: '2024-08-18',
    time: '10:00',
    status: 'Confirmed',
    duration: 45
  },
  {
    id: 'A-105',
    customerId: 'c3',
    serviceId: 's2',
    serviceName: 'Teeth Whitening',
    date: '2024-08-16',
    time: '14:00',
    status: 'Completed',
    duration: 60
  }
];

export const automations: Automation[] = [
  {
    id: 'auto1',
    name: 'Comment → DM',
    active: true,
    steps: ['Instagram Comment', 'Detect purchase question', 'Reply publicly', 'Send DM'],
    vertical: 'commerce'
  },
  {
    id: 'auto2',
    name: 'Abandoned Lead Follow-up',
    active: true,
    steps: ['Customer asks about product', 'No order after 2 hours', 'Send follow-up'],
    vertical: 'commerce'
  },
  {
    id: 'auto3',
    name: 'Back in Stock',
    active: false,
    steps: ['Product becomes available', 'Find interested customers', 'Send message'],
    vertical: 'commerce'
  },
  {
    id: 'auto4',
    name: 'Inquiry → Booking',
    active: true,
    steps: ['New inquiry', 'Answer service question', 'Check availability', 'Offer times', 'Book appointment'],
    vertical: 'appointments'
  },
  {
    id: 'auto5',
    name: 'No-show Follow-up',
    active: true,
    steps: ['Missed appointment', 'Send follow-up', 'Offer rescheduling'],
    vertical: 'appointments'
  }
];

export const faqs: FAQ[] = [
  {
    id: 'faq1',
    question: 'What are your delivery times?',
    answer: 'We deliver within 2-3 business days in Cairo and Giza, and 3-5 days for other governorates.',
    category: 'Delivery',
    vertical: 'commerce'
  },
  {
    id: 'faq2',
    question: 'What is your return policy?',
    answer: 'You can return items within 14 days of delivery for a full refund or exchange.',
    category: 'Returns',
    vertical: 'commerce'
  },
  {
    id: 'faq3',
    question: 'Do you accept card payments?',
    answer: 'Currently we accept Cash on Delivery. Card payments coming soon.',
    category: 'Payment',
    vertical: 'commerce'
  },
  {
    id: 'faq4',
    question: 'What are your working hours?',
    answer: 'We are open Saturday to Thursday, 9 AM to 5 PM. Closed on Fridays.',
    category: 'Opening Hours',
    vertical: 'appointments'
  },
  {
    id: 'faq5',
    question: 'How do I reschedule an appointment?',
    answer: 'You can reschedule through our AI assistant or by calling us at least 24 hours in advance.',
    category: 'Booking',
    vertical: 'appointments'
  },
  {
    id: 'faq6',
    question: 'Do you accept walk-ins?',
    answer: 'We recommend booking in advance, but we do accept walk-ins based on availability.',
    category: 'Booking',
    vertical: 'appointments'
  }
];

export const sources: Source[] = [
  { id: 'src1', name: 'Product Catalog.pdf', type: 'PDF', inUse: true },
  { id: 'src2', name: 'Return Policy.docx', type: 'DOCX', inUse: true },
  { id: 'src3', name: 'Service Price List.pdf', type: 'PDF', inUse: true },
  { id: 'src4', name: 'Clinic Hours.txt', type: 'Text', inUse: true },
  { id: 'src5', name: 'FAQ Database', type: 'URL', inUse: false }
];

export const followUps: FollowUp[] = [
  {
    id: 'fu1',
    customerId: 'c3',
    context: 'Asked about Black Bag, no order',
    scheduledTime: 'Follow up in 2h',
    status: 'pending',
    vertical: 'commerce',
    message: "Hi! Just checking if you're still interested in the Black Leather Bag. It's still available!"
  },
  {
    id: 'fu2',
    customerId: 'c4',
    context: 'Asked about T-Shirt, no order',
    scheduledTime: 'Follow up in 1h',
    status: 'pending',
    vertical: 'commerce',
    message: 'Hey! The Classic T-Shirt is waiting for you. Size L is still in stock.'
  },
  {
    id: 'fu3',
    customerId: 'c8',
    context: 'Asked about delivery, no order',
    scheduledTime: 'Follow up tomorrow',
    status: 'pending',
    vertical: 'commerce',
    message: 'Following up on your delivery question. We deliver to Alexandria for 50 EGP!'
  },
  {
    id: 'fu4',
    customerId: 'c7',
    context: 'Asked about whitening, no booking',
    scheduledTime: 'Follow up in 3h',
    status: 'pending',
    vertical: 'appointments',
    message: 'Hi! You inquired about Teeth Whitening. We have a slot available tomorrow at 11 AM.'
  },
  {
    id: 'fu5',
    customerId: 'c2',
    context: 'Asked about cleaning, no booking',
    scheduledTime: 'Follow up in 2h',
    status: 'pending',
    vertical: 'appointments',
    message: 'Reminder: Dental Cleaning slots are filling up fast for this week!'
  }
];

export const teamMembers: TeamMember[] = [
  { id: 't1', name: 'Ahmed Hassan', email: 'ahmed@clinic.com', role: 'Owner', status: 'Active' },
  { id: 't2', name: 'Samar Ibrahim', email: 'samar@clinic.com', role: 'Agent', status: 'Active' },
  { id: 't3', name: 'Khaled Mostafa', email: 'khaled@clinic.com', role: 'Viewer', status: 'Pending' }
];

export const notificationSettings: NotificationSetting[] = [
  { event: 'New lead', email: true, inApp: true },
  { event: 'Order created', email: true, inApp: true },
  { event: 'Appointment booked', email: true, inApp: true },
  { event: 'Escalation', email: true, inApp: true },
  { event: 'Daily summary', email: false, inApp: true }
];

// Analytics data
export const analyticsData = {
  commerce: {
    '7d': {
      conversations: [120, 145, 132, 168, 155, 190, 210],
      revenue: [8500, 12000, 9800, 15000, 11200, 18500, 22000],
      leads: [18, 22, 19, 28, 25, 32, 35],
      conversionRate: 16.2,
      aiResolutionRate: 78.5,
      humanHandoffRate: 21.5,
      avgResponseTime: '1.2 min',
      followUpRecoveryRate: 34.2,
      avgOrderValue: 850,
      abandonedLeads: 12,
      codOrders: 85,
      topProducts: [
        { name: 'Nike Running Shoes', value: 12000 },
        { name: 'Black Leather Bag', value: 8500 },
        { name: 'Cotton Hoodie', value: 6500 },
        { name: 'Classic T-Shirt', value: 4800 },
        { name: 'Leather Wallet', value: 3200 }
      ]
    },
    '30d': {
      conversations: [120, 145, 132, 168, 155, 190, 210, 180, 195, 220, 175, 200, 185, 230, 240, 210, 195, 220, 205, 250, 230, 215, 240, 225, 260, 245, 230, 255, 240, 270],
      revenue: [8500, 12000, 9800, 15000, 11200, 18500, 22000, 14000, 16500, 21000, 13000, 17500, 15500, 20000, 23000, 18000, 16000, 19500, 17000, 24000, 21500, 18500, 21000, 19000, 25000, 22500, 20000, 23500, 21000, 28000],
      leads: [18, 22, 19, 28, 25, 32, 35, 28, 30, 38, 25, 33, 29, 36, 40, 32, 30, 37, 33, 42, 38, 34, 39, 35, 44, 40, 36, 41, 37, 46],
      conversionRate: 18.4,
      aiResolutionRate: 76.2,
      humanHandoffRate: 23.8,
      avgResponseTime: '1.4 min',
      followUpRecoveryRate: 32.8,
      avgOrderValue: 920,
      abandonedLeads: 45,
      codOrders: 82,
      topProducts: [
        { name: 'Nike Running Shoes', value: 48000 },
        { name: 'Black Leather Bag', value: 35000 },
        { name: 'Cotton Hoodie', value: 28000 },
        { name: 'Classic T-Shirt', value: 22000 },
        { name: 'Leather Wallet', value: 15000 }
      ]
    },
    '90d': {
      conversations: Array.from({length: 90}, () => Math.floor(Math.random() * 100) + 150),
      revenue: Array.from({length: 90}, () => Math.floor(Math.random() * 15000) + 10000),
      leads: Array.from({length: 90}, () => Math.floor(Math.random() * 30) + 20),
      conversionRate: 17.8,
      aiResolutionRate: 75.5,
      humanHandoffRate: 24.5,
      avgResponseTime: '1.5 min',
      followUpRecoveryRate: 31.5,
      avgOrderValue: 950,
      abandonedLeads: 138,
      codOrders: 80,
      topProducts: [
        { name: 'Nike Running Shoes', value: 145000 },
        { name: 'Black Leather Bag', value: 98000 },
        { name: 'Cotton Hoodie', value: 72000 },
        { name: 'Classic T-Shirt', value: 58000 },
        { name: 'Leather Wallet', value: 42000 }
      ]
    }
  },
  appointments: {
    '7d': {
      conversations: [45, 52, 48, 61, 55, 68, 72],
      bookings: [8, 10, 9, 12, 11, 14, 15],
      leads: [12, 15, 13, 18, 16, 20, 22],
      conversionRate: 22.5,
      aiResolutionRate: 82.1,
      humanHandoffRate: 17.9,
      avgResponseTime: '1.1 min',
      followUpRecoveryRate: 28.4,
      bookingConversion: 68.2,
      noShows: 2,
      cancellationRate: 8.5,
      utilization: 72,
      topServices: [
        { name: 'Dental Cleaning', value: 35 },
        { name: 'Teeth Whitening', value: 22 },
        { name: 'Consultation', value: 18 }
      ]
    },
    '30d': {
      conversations: [45, 52, 48, 61, 55, 68, 72, 58, 63, 75, 55, 70, 62, 78, 82, 68, 65, 75, 70, 85, 80, 72, 78, 74, 88, 84, 76, 82, 78, 90],
      bookings: [8, 10, 9, 12, 11, 14, 15, 12, 13, 16, 11, 14, 12, 16, 17, 14, 13, 15, 14, 18, 17, 15, 16, 15, 19, 18, 16, 17, 16, 20],
      leads: [12, 15, 13, 18, 16, 20, 22, 17, 19, 23, 17, 21, 18, 24, 25, 20, 19, 23, 21, 26, 24, 21, 23, 22, 27, 25, 22, 24, 23, 28],
      conversionRate: 21.8,
      aiResolutionRate: 80.5,
      humanHandoffRate: 19.5,
      avgResponseTime: '1.2 min',
      followUpRecoveryRate: 27.2,
      bookingConversion: 66.5,
      noShows: 8,
      cancellationRate: 9.2,
      utilization: 68,
      topServices: [
        { name: 'Dental Cleaning', value: 142 },
        { name: 'Teeth Whitening', value: 89 },
        { name: 'Consultation', value: 72 }
      ]
    },
    '90d': {
      conversations: Array.from({length: 90}, () => Math.floor(Math.random() * 40) + 50),
      bookings: Array.from({length: 90}, () => Math.floor(Math.random() * 8) + 10),
      leads: Array.from({length: 90}, () => Math.floor(Math.random() * 15) + 15),
      conversionRate: 21.2,
      aiResolutionRate: 79.8,
      humanHandoffRate: 20.2,
      avgResponseTime: '1.3 min',
      followUpRecoveryRate: 26.8,
      bookingConversion: 65.2,
      noShows: 24,
      cancellationRate: 9.8,
      utilization: 65,
      topServices: [
        { name: 'Dental Cleaning', value: 425 },
        { name: 'Teeth Whitening', value: 268 },
        { name: 'Consultation', value: 215 }
      ]
    }
  }
};

// Activity timeline data
export const activityTimeline = [
  { id: 'a1', customerId: 'c1', date: '2024-08-17', text: 'Purchased Black Bag', type: 'order' },
  { id: 'a2', customerId: 'c1', date: '2024-08-15', text: 'Asked about delivery', type: 'conversation' },
  { id: 'a3', customerId: 'c1', date: '2024-08-10', text: 'Order #1045 delivered', type: 'order' },
  { id: 'a4', customerId: 'c1', date: '2024-08-05', text: 'Instagram conversation started', type: 'conversation' },
  { id: 'a5', customerId: 'c3', date: '2024-08-17', text: 'Order #1049 created', type: 'order' },
  { id: 'a6', customerId: 'c3', date: '2024-08-14', text: 'Purchased Classic T-Shirt', type: 'order' },
  { id: 'a7', customerId: 'c3', date: '2024-08-12', text: 'Asked about size L', type: 'conversation' },
  { id: 'a8', customerId: 'c5', date: '2024-08-16', text: 'Order #1047 processing', type: 'order' },
  { id: 'a9', customerId: 'c5', date: '2024-08-14', text: 'Asked about running shoes', type: 'conversation' },
  { id: 'a10', customerId: 'c7', date: '2024-08-17', text: 'Appointment A-102 confirmed', type: 'appointment' }
];

// Notes
export const customerNotes = [
  { id: 'n1', customerId: 'c1', text: 'VIP customer, prefers fast delivery. Always confirm stock before creating order.', author: 'Ahmed Hassan', date: '2024-08-15' },
  { id: 'n2', customerId: 'c1', text: 'Called to confirm address. Lives in downtown Cairo.', author: 'Samar Ibrahim', date: '2024-08-10' },
  { id: 'n3', customerId: 'c3', text: 'Price sensitive, always asks for discounts. Offer 10% on next order.', author: 'Ahmed Hassan', date: '2024-08-14' }
];

export const workingHours = [
  { day: 'Saturday', open: true, start: '09:00', end: '17:00' },
  { day: 'Sunday', open: true, start: '09:00', end: '17:00' },
  { day: 'Monday', open: true, start: '09:00', end: '17:00' },
  { day: 'Tuesday', open: true, start: '09:00', end: '17:00' },
  { day: 'Wednesday', open: true, start: '09:00', end: '17:00' },
  { day: 'Thursday', open: true, start: '09:00', end: '17:00' },
  { day: 'Friday', open: false, start: '09:00', end: '14:00' }
];
