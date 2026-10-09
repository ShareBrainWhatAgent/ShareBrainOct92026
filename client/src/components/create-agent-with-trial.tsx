import CreateAgent from "@/pages/create-agent";
import { TrialRequired } from "./trial-required";

export default function CreateAgentWithTrial() {
  return (
    <TrialRequired>
      <CreateAgent />
    </TrialRequired>
  );
}