var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import StudentList from './StudentList';
import CreateStudentForm from './CreateStudentForm';
import EditStudentForm from './EditStudentForm';
import AssignCourseModal from './AssignCourseModal';
import { db } from '../../../lib/firebaseConfig';
export default function StudentManagementTab() {
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showAssignCourseModal, setShowAssignCourseModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const handleStudentCreated = () => {
        setRefreshKey(k => k + 1);
    };
    const handleEditStudent = (student) => {
        setSelectedStudent(student);
        setShowEditForm(true);
    };
    const handleAssignCourse = (student) => {
        setSelectedStudent(student);
        setShowAssignCourseModal(true);
    };
    const handleDeleteStudent = (studentId) => __awaiter(this, void 0, void 0, function* () {
        if (!window.confirm('Are you sure you want to delete this student? This action cannot be undone.'))
            return;
        setLoading(true);
        setError('');
        try {
            yield import('firebase/firestore').then(({ deleteDoc, doc }) => deleteDoc(doc(db, 'kids', studentId)));
            setRefreshKey(k => k + 1);
        }
        catch (err) {
            if (err instanceof Error) {
                setError(err.message || 'Delete failed');
            }
            else {
                setError('Delete failed');
            }
        }
        finally {
            setLoading(false);
        }
    });
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h2", { className: "text-2xl font-bold", children: "Student Management" }), _jsx(CreateStudentForm, { onStudentCreated: handleStudentCreated })] }), error && _jsx("div", { className: "text-red-500 mb-2", children: error }), _jsx(StudentList, { onEdit: handleEditStudent, onDelete: handleDeleteStudent, onAssignCourse: handleAssignCourse }, refreshKey), selectedStudent && showEditForm && (_jsx(EditStudentForm, { student: selectedStudent, open: showEditForm, onClose: () => { setShowEditForm(false); setSelectedStudent(null); }, onUpdated: () => { setShowEditForm(false); setSelectedStudent(null); setRefreshKey(k => k + 1); } })), selectedStudent && showAssignCourseModal && (_jsx(AssignCourseModal, { student: selectedStudent, onClose: () => { setShowAssignCourseModal(false); setSelectedStudent(null); }, onAssigned: () => { setShowAssignCourseModal(false); setSelectedStudent(null); setRefreshKey(k => k + 1); } })), loading && _jsx("div", { className: "text-gray-500", children: "Processing..." })] }));
}
