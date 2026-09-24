import { ContentEditor } from "@/components/admin/ContentEditor";

export default function NewContentPage() {
  return (
    <div>
      <div className="section-head">
        <h2>Forge a new piece</h2>
      </div>
      <ContentEditor id={null} />
    </div>
  );
}