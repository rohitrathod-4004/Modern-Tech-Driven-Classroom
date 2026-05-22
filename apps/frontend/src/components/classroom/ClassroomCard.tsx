import React from "react";
import type { Classroom } from "../../hooks/useClassrooms";

interface ClassroomCardProps {
  classroom: Classroom;
  onSelect: (classroom: Classroom) => void;
  role: "faculty" | "student";
}

export const ClassroomCard: React.FC<ClassroomCardProps> = ({ classroom, onSelect, role }) => {
  const facultyName =
    typeof classroom.faculty_id === "object" ? classroom.faculty_id.name : "Faculty";

  return (
    <div
      className="classroom-card"
      onClick={() => onSelect(classroom)}
    >
      <div className="classroom-card-header">
        <h3 className="classroom-card-name">{classroom.name}</h3>
        <span className="classroom-card-code">{classroom.code}</span>
      </div>
      <div className="classroom-card-meta">
        {role === "faculty" ? (
          <span>{classroom.students.length} student{classroom.students.length !== 1 ? "s" : ""}</span>
        ) : (
          <span>Prof. {facultyName}</span>
        )}
        <span>{new Date(classroom.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="classroom-card-footer">
        <span className="classroom-card-cta">View Details →</span>
      </div>
    </div>
  );
};
