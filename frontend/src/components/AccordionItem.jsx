import { useState } from "react";

function AccordionItem({ title, content }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{
      border: "0.5px solid #e0e0e0",
      borderRadius: "12px",
      overflow: "hidden",
      backgroundColor: "#ffffff",
    }}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          cursor: "pointer",
          userSelect: "none",
          gap: "12px",
          backgroundColor: isOpen ? "#f5f5f5" : "transparent",
        }}
      >
        <span style={{ fontSize: "15px", fontWeight: 500 }}>{title}</span>
        <svg
          width="18" height="18" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          style={{
            flexShrink: 0,
            color: "#888",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      <div style={{
        maxHeight: isOpen ? "400px" : "0",
        overflow: "scroll",
        transition: "max-height 0.3s ease",
      }}>
        <div style={{
          padding: "14px 18px 16px",
          fontSize: "14px",
          color: "#666",
          lineHeight: 1.7,
          borderTop: "0.5px solid #e0e0e0",
        }}>
          {content}
        </div>
      </div>
    </div>
  );
}

export default AccordionItem;