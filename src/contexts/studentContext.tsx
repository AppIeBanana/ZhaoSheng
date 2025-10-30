import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the type for student data
interface StudentData {
  examType: string;
  studentType: string;
  province: string;
  minzu: string;
  score: string;
}

// Define the context type
interface StudentContextType {
  studentData: StudentData | null;
  setStudentData: (data: StudentData) => void;
}

// Create the context with a default value
const StudentContext = createContext<StudentContextType | undefined>(undefined);

// Create the provider component
export const StudentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [studentData, setStudentData] = useState<StudentData | null>(null);

  return (
    <StudentContext.Provider value={{ studentData, setStudentData }}>
      {children}
    </StudentContext.Provider>
  );
};

// Create a custom hook to use the context
export const useStudentData = () => {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudentData must be used within a StudentProvider');
  }
  return context;
};