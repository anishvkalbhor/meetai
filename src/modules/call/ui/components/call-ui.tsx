import { EventTypes, StreamTheme, useCall } from "@stream-io/video-react-sdk";
import { useState, useEffect } from "react";
import { CallLobby } from "./call-lobby";
import { CallActive } from "./call-active";
import { CallEnded } from "./call-ended";

interface Props {
  meetingName: string;
}

export const CallUI = ({ meetingName }: Props) => {
  const call = useCall();
  const [show, setShow] = useState<"lobby" | "call" | "ended">("lobby");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!call) return;
    
    setIsJoining(true);
    setError(null);
    
    try {
      console.log("Attempting to join call:", call.id, "State:", call.state.callingState);
      
      // Check if call is in the right state
      if (call.state.callingState === "left" || call.state.callingState === "offline") {
        console.log("Call is in left/offline state, attempting to join...");
        await call.join();
        console.log("Successfully joined call");
        setShow("call");
      } else if (call.state.callingState === "joined") {
        console.log("Call is already active, switching to call view");
        setShow("call");
      } else if (call.state.callingState === "idle") {
        console.log("Call is idle, attempting to join...");
        await call.join();
        setShow("call");
      } else {
        console.log("Call is in state:", call.state.callingState, "attempting to join...");
        try {
          await call.join();
          setShow("call");
        } catch (joinError) {
          console.error("Join failed, trying alternative approach:", joinError);
          // Try to force join by recreating the call
          console.log("Current call state:", call.state.callingState);
          setShow("call"); // Force UI to call view anyway
        }
      }
    } catch (err) {
      console.error("Failed to join call:", err);
      
      // Check if it's a configuration error
      if (err instanceof Error && err.message.includes("Not Found")) {
        setError("Call configuration error. Please check your Stream.io Video app setup.");
      } else if (err instanceof Error && err.message.includes("Unauthorized")) {
        setError("Authentication error. Please check your API keys.");
      } else {
        setError("Failed to join the call. Please try again.");
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    if (!call) return;

    try {
      console.log("Leaving call:", call.id, "Current state:", call.state.callingState);
      
      // Check if call is already left or in a state where we can't leave
      if (call.state.callingState === "left" || call.state.callingState === "offline") {
        console.log("Call is already left/offline, just updating UI state");
        setShow("ended");
        return;
      }

      // Only try to leave if we're actually in the call
      if (call.state.callingState === "joined" || call.state.callingState === "joining") {
        await call.leave();
        console.log("Successfully left call");
      }
      
      setShow("ended");
    } catch (err) {
      console.error("Failed to leave call:", err);
      // Force end state even if leave fails
      setShow("ended");
    }
  };

  // Listen for call state changes
  useEffect(() => {
    if (!call) return;

    const handleCallStateChange = () => {
      console.log("Call state changed:", call.state.callingState);
      
      // Update UI state based on call state
      if (call.state.callingState === "left" || call.state.callingState === "offline") {
        setShow("ended");
      } else if (call.state.callingState === "joined") {
        setShow("call");
      }
    };

    // Use the correct event type
    call.on("call.state.changed" as unknown as EventTypes, handleCallStateChange);

    // Also handle initial state
    handleCallStateChange();

    return () => {
      call.off("call.state.changed" as unknown as EventTypes, handleCallStateChange);
    };
  }, [call]);

  // Show error if there's one
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-radial from-sidebar-accent to-sidebar">
        <div className="flex flex-col items-center justify-center gap-y-6 p-10 rounded-lg shadow-sm bg-background">
          <div className="flex flex-col gap-y-2 text-center">
            <h6 className="text-lg font-medium text-red-600">Error</h6>
            <p className="text-sm">{error}</p>
          </div>
          <button 
            onClick={() => {
              setError(null);
              setShow("lobby");
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <StreamTheme className="h-full">
      {show === "lobby" && <CallLobby onJoin={handleJoin} isJoining={isJoining} />}
      {show === "call" && (
        <CallActive onLeave={handleLeave} meetingName={meetingName} />
      )}
      {show === "ended" && <CallEnded />}
    </StreamTheme>
  );
};
