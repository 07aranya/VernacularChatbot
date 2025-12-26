import { SavedSession, TopicMetric } from '../types';

const STORAGE_KEY = 'yourbuddy_chat_history';
const ANALYTICS_KEY = 'yourbuddy_analytics';

export const getSessions = (): SavedSession[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    // Restore dates
    return parsed.map((session: any) => ({
      ...session,
      messages: session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    })).sort((a: SavedSession, b: SavedSession) => b.timestamp - a.timestamp);
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const saveSession = (session: SavedSession) => {
  try {
    const sessions = getSessions();
    const index = sessions.findIndex(s => s.id === session.id);
    
    if (index >= 0) {
      sessions[index] = session;
    } else {
      // Add new to top
      sessions.unshift(session);
    }
    
    // Limit to 20 sessions to save space
    if (sessions.length > 20) {
      sessions.pop();
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error("Failed to save session", e);
  }
};

export const deleteSession = (id: string) => {
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export const createNewSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// --- Analytics ---

export const trackTopic = (topicName: string) => {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    const data: Record<string, TopicMetric> = raw ? JSON.parse(raw) : {};
    
    // Normalize key to handle case sensitivity (e.g. "Algebra" vs "algebra")
    const key = topicName.trim().toLowerCase();
    
    if (data[key]) {
      data[key].count += 1;
      data[key].lastAsked = Date.now();
      // Update display name to the most recent usage (helps fix capitalization over time)
      data[key].topic = topicName.trim(); 
    } else {
      data[key] = {
        topic: topicName.trim(),
        count: 1,
        lastAsked: Date.now()
      };
    }
    
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to track topic", e);
  }
};

export const getAnalytics = (): TopicMetric[] => {
  try {
    const raw = localStorage.getItem(ANALYTICS_KEY);
    if (!raw) return [];
    
    const data: Record<string, TopicMetric> = JSON.parse(raw);
    return Object.values(data).sort((a, b) => b.count - a.count);
  } catch (e) {
    console.error("Failed to load analytics", e);
    return [];
  }
};