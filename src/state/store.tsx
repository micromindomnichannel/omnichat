import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Conversation, Message, Product, Service, Order, Appointment, Automation, FAQ, Source, FollowUp, TeamMember, NotificationSetting, Customer } from './mockData';
import * as mockData from './mockData';
import { api } from '../services/api';

interface AppState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  customers: Customer[];
  products: Product[];
  services: Service[];
  orders: Order[];
  appointments: Appointment[];
  automations: Automation[];
  faqs: FAQ[];
  sources: Source[];
  followUps: FollowUp[];
  teamMembers: TeamMember[];
  notificationSettings: NotificationSetting[];
  businessName: string;
  businessLogo: string;
  industry: string;
  businessDescription: string;
  channelsConnected: Record<string, boolean>;
  aiEnabled: boolean;
  aiTone: string;
  aiLanguage: string;
  aiHandoffRules: string[];
  aiConfidenceThreshold: number;
  workingHours: typeof mockData.workingHours;
  onboardingComplete: boolean;
  currentUser: { name: string; email: string; avatar: string };
  toasts: Array<{ id: string; message: string; type: 'success' | 'warning' | 'danger' }>;
  dbConnected: boolean;
}

type Action =
  | { type: 'SET_BOOTSTRAP_DATA'; payload: any }
  | { type: 'SET_CONVERSATION_STATUS'; id: string; status: Conversation['status'] }
  | { type: 'ADD_MESSAGE'; conversationId: string; message: Message }
  | { type: 'UPDATE_PRODUCT'; product: Product }
  | { type: 'ADD_PRODUCT'; product: Product }
  | { type: 'UPDATE_SERVICE'; service: Service }
  | { type: 'ADD_SERVICE'; service: Service }
  | { type: 'ADD_ORDER'; order: Order }
  | { type: 'UPDATE_ORDER'; order: Order }
  | { type: 'ADD_APPOINTMENT'; appointment: Appointment }
  | { type: 'UPDATE_APPOINTMENT'; appointment: Appointment }
  | { type: 'TOGGLE_AUTOMATION'; id: string }
  | { type: 'ADD_FAQ'; faq: FAQ }
  | { type: 'DELETE_FAQ'; id: string }
  | { type: 'ADD_SOURCE'; source: Source }
  | { type: 'DELETE_SOURCE'; id: string }
  | { type: 'UPDATE_FOLLOWUP'; followUp: FollowUp }
  | { type: 'DELETE_FOLLOWUP'; id: string }
  | { type: 'ADD_TEAM_MEMBER'; member: TeamMember }
  | { type: 'UPDATE_NOTIFICATION'; event: string; channel: 'email' | 'inApp'; value: boolean }
  | { type: 'UPDATE_BUSINESS'; field: string; value: string }
  | { type: 'TOGGLE_CHANNEL'; channel: string }
  | { type: 'UPDATE_AI_SETTINGS'; field: string; value: any }
  | { type: 'UPDATE_WORKING_HOURS'; day: string; field: string; value: any }
  | { type: 'COMPLETE_ONBOARDING' }
  | { type: 'ADD_TOAST'; toast: { id: string; message: string; type: 'success' | 'warning' | 'danger' } }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'UPDATE_CUSTOMER'; customer: Customer }
  | { type: 'ADD_NOTE'; customerId: string; note: any };

const initialState: AppState = {
  conversations: [...mockData.conversations],
  messages: { ...mockData.messages },
  customers: [...mockData.customers],
  products: [...mockData.products],
  services: [...mockData.services],
  orders: [...mockData.orders],
  appointments: [...mockData.appointments],
  automations: [...mockData.automations],
  faqs: [...mockData.faqs],
  sources: [...mockData.sources],
  followUps: [...mockData.followUps],
  teamMembers: [...mockData.teamMembers],
  notificationSettings: [...mockData.notificationSettings],
  businessName: 'ORBIT Omnichannel Platform',
  businessLogo: '',
  industry: 'Retail & Clinic',
  businessDescription: 'Powered Omnichannel Business & Clinic Platform',
  channelsConnected: {
    instagram: true,
    whatsapp: true,
    facebook: true,
    tiktok: false,
    website: true
  },
  aiEnabled: true,
  aiTone: 'Friendly',
  aiLanguage: 'Both',
  aiHandoffRules: ['Escalate if customer is angry', 'Escalate if order value > 5000 EGP'],
  aiConfidenceThreshold: 70,
  workingHours: JSON.parse(JSON.stringify(mockData.workingHours)),
  onboardingComplete: false,
  currentUser: {
    name: 'Ahmed Hassan',
    email: 'ahmed@orbit.com',
    avatar: mockData.getAvatar('Ahmed Hassan')
  },
  toasts: [],
  dbConnected: true
};

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_BOOTSTRAP_DATA':
      return {
        ...state,
        products: action.payload.products?.length ? action.payload.products : state.products,
        services: action.payload.services?.length ? action.payload.services : state.services,
        customers: action.payload.customers?.length ? action.payload.customers : state.customers,
        conversations: action.payload.conversations?.length ? action.payload.conversations : state.conversations,
        orders: action.payload.orders?.length ? action.payload.orders : state.orders,
        appointments: action.payload.appointments?.length ? action.payload.appointments : state.appointments,
        dbConnected: true
      };

    case 'SET_CONVERSATION_STATUS':
      api.updateConversationStatus(action.id, action.status);
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.id === action.id ? { ...c, status: action.status } : c
        )
      };

    case 'ADD_MESSAGE':
      api.addMessage(action.conversationId, action.message);
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.conversationId]: [
            ...(state.messages[action.conversationId] || []),
            action.message
          ]
        }
      };

    case 'UPDATE_PRODUCT':
      api.updateProduct(action.product);
      return {
        ...state,
        products: state.products.map(p => p.id === action.product.id ? action.product : p)
      };

    case 'ADD_PRODUCT':
      api.addProduct(action.product);
      return { ...state, products: [...state.products, action.product] };

    case 'UPDATE_SERVICE':
      api.updateService(action.service);
      return {
        ...state,
        services: state.services.map(s => s.id === action.service.id ? action.service : s)
      };

    case 'ADD_SERVICE':
      api.addService(action.service);
      return { ...state, services: [...state.services, action.service] };

    case 'ADD_ORDER':
      api.addOrder(action.order);
      return { ...state, orders: [...state.orders, action.order] };

    case 'UPDATE_ORDER':
      api.updateOrder(action.order);
      return {
        ...state,
        orders: state.orders.map(o => o.id === action.order.id ? action.order : o)
      };

    case 'ADD_APPOINTMENT':
      api.addAppointment(action.appointment);
      return { ...state, appointments: [...state.appointments, action.appointment] };

    case 'UPDATE_APPOINTMENT':
      api.updateAppointment(action.appointment);
      return {
        ...state,
        appointments: state.appointments.map(a => a.id === action.appointment.id ? action.appointment : a)
      };

    case 'TOGGLE_AUTOMATION':
      api.toggleAutomation(action.id);
      return {
        ...state,
        automations: state.automations.map(a =>
          a.id === action.id ? { ...a, active: !a.active } : a
        )
      };

    case 'ADD_FAQ':
      api.addFaq(action.faq);
      return { ...state, faqs: [...state.faqs, action.faq] };

    case 'DELETE_FAQ':
      api.deleteFaq(action.id);
      return { ...state, faqs: state.faqs.filter(f => f.id !== action.id) };

    case 'ADD_SOURCE':
      return { ...state, sources: [...state.sources, action.source] };

    case 'DELETE_SOURCE':
      return { ...state, sources: state.sources.filter(s => s.id !== action.id) };

    case 'UPDATE_FOLLOWUP':
      return {
        ...state,
        followUps: state.followUps.map(f => f.id === action.followUp.id ? action.followUp : f)
      };

    case 'DELETE_FOLLOWUP':
      return { ...state, followUps: state.followUps.filter(f => f.id !== action.id) };

    case 'ADD_TEAM_MEMBER':
      return { ...state, teamMembers: [...state.teamMembers, action.member] };

    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notificationSettings: state.notificationSettings.map(n =>
          n.event === action.event ? { ...n, [action.channel]: action.value } : n
        )
      };

    case 'UPDATE_BUSINESS':
      return { ...state, [action.field]: action.value };

    case 'TOGGLE_CHANNEL':
      return {
        ...state,
        channelsConnected: {
          ...state.channelsConnected,
          [action.channel]: !state.channelsConnected[action.channel]
        }
      };

    case 'UPDATE_AI_SETTINGS':
      api.updateSettings({ ...state, [action.field]: action.value });
      return { ...state, [action.field]: action.value };

    case 'UPDATE_WORKING_HOURS':
      return {
        ...state,
        workingHours: state.workingHours.map(wh =>
          wh.day === action.day ? { ...wh, [action.field]: action.value } : wh
        )
      };

    case 'COMPLETE_ONBOARDING':
      return { ...state, onboardingComplete: true };

    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast] };

    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter(t => t.id !== action.id) };

    case 'UPDATE_CUSTOMER':
      api.updateCustomer(action.customer);
      return {
        ...state,
        customers: state.customers.map(c => c.id === action.customer.id ? action.customer : c)
      };

    default:
      return state;
  }
}

interface StoreContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  showToast: (message: string, type?: 'success' | 'warning' | 'danger') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Fetch initial database bootstrap on app load
  useEffect(() => {
    api.getBootstrap().then(data => {
      if (data) {
        dispatch({ type: 'SET_BOOTSTRAP_DATA', payload: data });
      }
    });
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'danger' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    dispatch({ type: 'ADD_TOAST', toast: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE_TOAST', id }), 4000);
  }, [dispatch]);

  return (
    <StoreContext.Provider value={{ state, dispatch, showToast }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export type { AppState, Action };
