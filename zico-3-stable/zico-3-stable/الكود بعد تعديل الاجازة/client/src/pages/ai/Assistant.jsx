import PageHeader from "../../components/PageHeader";

const ASSISTANT_URL = "https://nlp-deep-learning-project-for-security-regulation.streamlit.app/";

export default function Assistant() {
  return (
    <>
      <PageHeader title="AI Assistant" subtitle="Ask questions about security regulation using the NLP assistant." />
      <div className="card h-[calc(100vh-16rem)] overflow-hidden p-0">
        <iframe
          src={ASSISTANT_URL}
          title="AI Assistant"
          className="h-full w-full border-0"
          allow="clipboard-write"
        />
      </div>
    </>
  );
}
