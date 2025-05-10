// backend/src/models/SessionLog.ts
import supabase from "../config/supabase";

export interface TranscriptLog {
  type: "transcript";
  text: string;
  isFinal: boolean;
  confidence: number;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

export interface SystemActionLog {
  type: "action";
  action: string;
  details: string;
  timestamp: number;
  status?: "success" | "error" | "pending" | "info";
  sessionId: string;
  userId?: string;
}

export type SessionLog = TranscriptLog | SystemActionLog;

export const createTranscriptLog = async (log: Omit<TranscriptLog, "type">) => {
  try {
    // Validate input data
    if (!log.text) {
      console.error("Cannot create transcript log: text is required");
      throw new Error("Text is required for transcript log");
    }

    if (log.confidence === undefined || log.confidence === null) {
      console.log("Confidence not provided, defaulting to 0");
      log.confidence = 0;
    }

    if (!log.sessionId) {
      console.error("Cannot create transcript log: sessionId is required");
      throw new Error("SessionId is required for transcript log");
    }

    // Ensure text is a string (in case an object was accidentally passed)
    const safeText = typeof log.text === "string" ? log.text : String(log.text);

    // Create the log entry
    const { data, error } = await supabase.from("session_logs").insert({
      type: "transcript",
      text: safeText,
      is_final: !!log.isFinal, // Convert to boolean
      confidence: Number(log.confidence), // Convert to number
      timestamp: new Date(log.timestamp),
      session_id: log.sessionId,
      user_id: log.userId || null,
      metadata: {
        confidence: log.confidence,
        isFinal: log.isFinal,
      },
    });

    if (error) {
      console.error("Error creating transcript log:", error);
      console.error(
        "Log data that caused error:",
        JSON.stringify({
          type: "transcript",
          text: safeText.substring(0, 30) + (safeText.length > 30 ? "..." : ""),
          is_final: !!log.isFinal,
          confidence: Number(log.confidence),
          timestamp: new Date(log.timestamp),
          session_id: log.sessionId,
          user_id: log.userId || null,
        })
      );
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Exception creating transcript log:", err);
    throw err;
  }
};

export const createSystemActionLog = async (
  log: Omit<SystemActionLog, "type">
) => {
  try {
    // Validate input data
    if (!log.action) {
      console.error("Cannot create system action log: action is required");
      throw new Error("Action is required for system action log");
    }

    if (!log.details) {
      console.error("Cannot create system action log: details are required");
      throw new Error("Details are required for system action log");
    }

    if (!log.sessionId) {
      console.error("Cannot create system action log: sessionId is required");
      throw new Error("SessionId is required for system action log");
    }

    // Ensure text is a string (in case an object was accidentally passed)
    const safeDetails =
      typeof log.details === "string" ? log.details : String(log.details);
    const safeAction =
      typeof log.action === "string" ? log.action : String(log.action);
    const safeStatus = log.status || "info";

    // Create the log entry
    const { data, error } = await supabase.from("session_logs").insert({
      type: "action",
      text: safeDetails,
      action: safeAction,
      status: safeStatus,
      timestamp: new Date(log.timestamp),
      session_id: log.sessionId,
      user_id: log.userId || null,
      metadata: {
        action: safeAction,
        status: safeStatus,
      },
    });

    if (error) {
      console.error("Error creating system action log:", error);
      console.error(
        "Log data that caused error:",
        JSON.stringify({
          type: "action",
          text:
            safeDetails.substring(0, 30) +
            (safeDetails.length > 30 ? "..." : ""),
          action: safeAction,
          status: safeStatus,
          timestamp: new Date(log.timestamp),
          session_id: log.sessionId,
          user_id: log.userId || null,
        })
      );
      throw error;
    }

    return data;
  } catch (err) {
    console.error("Exception creating system action log:", err);
    throw err;
  }
};

export const getSessionLogs = async (sessionId: string) => {
  try {
    const { data, error } = await supabase
      .from("session_logs")
      .select("*")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: true });

    if (error) {
      console.error("Error retrieving session logs:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log(`No logs found for session ID: ${sessionId}`);
      return [];
    }

    // Transform to frontend format
    return data.map((log) => {
      if (log.type === "transcript") {
        return {
          type: "transcript",
          text: log.text,
          isFinal: log.is_final,
          confidence: log.metadata?.confidence || 0,
          timestamp: new Date(log.timestamp).getTime(),
          sessionId: log.session_id,
          userId: log.user_id,
        } as TranscriptLog;
      } else {
        return {
          type: "action",
          action: log.action,
          details: log.text,
          status: log.status,
          timestamp: new Date(log.timestamp).getTime(),
          sessionId: log.session_id,
          userId: log.user_id,
        } as SystemActionLog;
      }
    });
  } catch (err) {
    console.error("Exception retrieving session logs:", err);
    throw err;
  }
};

export const getUserSessions = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("session_logs")
      .select("session_id, timestamp")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error retrieving user sessions:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log(`No sessions found for user ID: ${userId}`);
      return [];
    }

    // Get unique session IDs with their latest timestamp
    const sessions = Array.from(
      data.reduce((map, item) => {
        if (
          !map.has(item.session_id) ||
          new Date(item.timestamp) > new Date(map.get(item.session_id))
        ) {
          map.set(item.session_id, item.timestamp);
        }
        return map;
      }, new Map())
    ).map(([sessionId, timestamp]) => ({
      sessionId,
      lastActivityAt: timestamp,
    }));

    return sessions;
  } catch (err) {
    console.error("Exception retrieving user sessions:", err);
    throw err;
  }
};
