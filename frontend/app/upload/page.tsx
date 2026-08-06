import UploadCard from "@/components/upload/UploadCard";

export default function UploadPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-8)",
      }}
    >
      <UploadCard />
    </main>
  );
}
