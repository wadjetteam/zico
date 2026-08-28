import { ExternalLink } from "lucide-react";
import PageHeader from "../../components/PageHeader";

const ASSISTANT_URL = "https://nlp-deep-learning-project-for-security-regulation.streamlit.app/";

export default function Assistant() {
  return (
    <>
      <PageHeader title="AI Assistant" subtitle="Ask questions about security regulation using the NLP assistant." />
      <div className="card flex h-[calc(100vh-16rem)] flex-col items-center justify-center gap-4 p-5 text-center">
        <p className="max-w-md text-sm text-neutral-400">
          The assistant runs on Streamlit and can't be embedded here. Open it in a new tab to ask your question.
        </p>
        <a href={ASSISTANT_URL} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2">
          Open AI Assistant
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </>
  );
}
