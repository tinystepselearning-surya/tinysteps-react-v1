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
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form';
import KidMultiSelect from '@components/KidMultiSelect';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { toast } from '@components/hooks/use-toast';
import { auth } from '../../../lib/firebaseConfig';
const createUserSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    role: z.enum(['admin', 'teacher', 'parent', 'learningPartner', 'kid']),
    status: z.enum(['active', 'suspended', 'archived']),
    // Role-specific fields
    qualification: z.string().optional(),
    specialization: z.string().optional(),
    yearsExperience: z.number().min(0).optional(),
    bio: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    communicationLanguage: z.string().optional(),
    sessionTime: z.string().optional(),
    paymentMethods: z.string().optional(),
    region: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankIfscCode: z.string().optional(),
    bankAccountHolderName: z.string().optional(),
    isKidProfile: z.boolean().optional(),
    childIds: z.array(z.string()).optional(),
});
export function CreateUserForm({ onUserCreated, onClose }) {
    const [isLoading, setIsLoading] = useState(false);
    const [activeRole, setActiveRole] = useState('parent');
    const [createdUserData, setCreatedUserData] = useState(null);
    const [kids, setKids] = useState([]);
    const [isAdminLocal, setIsAdminLocal] = useState(null);
    const form = useForm({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            email: '',
            password: '',
            name: '',
            phone: '',
            role: 'parent',
            status: 'active',
            qualification: '',
            specialization: '',
            yearsExperience: undefined,
            bio: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            communicationLanguage: '',
            sessionTime: '',
            paymentMethods: '',
            region: '',
            bankAccountNumber: '',
            bankIfscCode: '',
            bankAccountHolderName: '',
            isKidProfile: false,
            childIds: [],
        },
    });
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!user) {
                console.error('Debug: No user logged in');
                setIsAdminLocal(false);
                toast({
                    title: 'Authentication Error',
                    description: 'You must be logged in to create users.',
                    variant: 'destructive',
                });
            }
            else {
                console.log('Debug: Logged-in user:', user);
                try {
                    const tokenResult = yield user.getIdTokenResult(true);
                    const isAdminClaim = ((_a = tokenResult.claims) === null || _a === void 0 ? void 0 : _a.admin) === true || ((_b = tokenResult.claims) === null || _b === void 0 ? void 0 : _b.role) === 'admin';
                    if (isAdminClaim) {
                        setIsAdminLocal(true);
                    }
                    else {
                        // No admin assertions found in token; default to false.
                        setIsAdminLocal(false);
                    }
                }
                catch (err) {
                    console.warn('Debug: Failed to determine admin claim locally', err);
                    setIsAdminLocal(false);
                }
            }
        }));
        return () => unsubscribe(); // Ensure cleanup to prevent memory leaks
    }, []);
    const onSubmit = (data) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        setIsLoading(true);
        console.log('Debug: onSubmit called with data:', data);
        try {
            // Ensure auth state is ready and refresh token
            const currentUser = yield new Promise((resolve) => {
                if (auth.currentUser)
                    return resolve(auth.currentUser);
                const unsub = auth.onAuthStateChanged((u) => {
                    unsub();
                    resolve(u);
                });
            });
            if (!currentUser) {
                throw new Error('You must be logged in to create users.');
            }
            console.log('Debug: currentUser exists:', {
                uid: currentUser.uid,
                email: currentUser.email,
            });
            // Force refresh token to ensure the callable has the latest token attached
            let freshToken = null;
            try {
                const token = yield currentUser.getIdToken(true);
                console.log('Debug: Refreshed ID token (first 8 chars):', (_a = token === null || token === void 0 ? void 0 : token.slice) === null || _a === void 0 ? void 0 : _a.call(token, 0, 8));
                freshToken = token;
            }
            catch (tErr) {
                console.warn('Debug: Failed to refresh token:', tErr);
            }
            const submitData = Object.assign(Object.assign({}, data), { displayName: data.name, role: activeRole, specialization: data.specialization ? data.specialization.split(',').map(s => s.trim()) : undefined, paymentMethods: data.paymentMethods ? data.paymentMethods.split(',').map(s => s.trim()) : undefined, adminToken: freshToken || undefined });
            console.log('Debug: submitData prepared:', submitData);
            const createUserFunction = httpsCallable(functions, 'adminCreateUser');
            console.log('Debug: Calling adminCreateUser with region functions:', functions);
            const result = yield createUserFunction(submitData);
            console.log('Debug: createUserFunction result:', result);
            const createdUser = result.data;
            if (createdUser && createdUser.success === false) {
                const message = createdUser.error || 'Failed to create user';
                console.error('Debug: User creation failed:', message);
                toast({ title: 'Error', description: message, variant: 'destructive' });
                return;
            }
            const resetLink = (createdUser === null || createdUser === void 0 ? void 0 : createdUser.resetLink) || null;
            setCreatedUserData(Object.assign(Object.assign({}, createdUser), { resetLink }));
            toast({
                title: 'User created',
                description: (createdUser === null || createdUser === void 0 ? void 0 : createdUser.uid)
                    ? `User created successfully (UID: ${createdUser.uid})`
                    : 'User created successfully',
            });
            form.reset();
            onUserCreated(result.data);
            // After creation, navigate to admin page and highlight new user if possible
            try {
                const createdUid = (_b = result.data) === null || _b === void 0 ? void 0 : _b.uid;
                if (createdUid) {
                    console.log('Debug: Redirecting to admin page with createdUserId:', createdUid);
                    window.location.href = `/surya?createdUserId=${createdUid}`;
                }
            }
            catch (err) {
                console.error('Debug: Error during redirect:', err);
            }
        }
        catch (error) {
            console.error('Debug: Error in onSubmit:', error);
            if ((error === null || error === void 0 ? void 0 : error.code) || (error === null || error === void 0 ? void 0 : error.status)) {
                console.error('Debug: callable error code/status:', error.code || error.status);
            }
            if (error === null || error === void 0 ? void 0 : error.details) {
                console.error('Debug: callable error details:', error.details);
            }
            // Provide clearer messaging for common function errors
            const code = (error === null || error === void 0 ? void 0 : error.code) || (error === null || error === void 0 ? void 0 : error.status) || null;
            let description = (error === null || error === void 0 ? void 0 : error.message) || 'Failed to create user. Try again.';
            if (code === 'permission-denied' || description.includes('Only admins')) {
                description = 'You do not have permission to create users. Ensure your account has the Admin role in Firestore or in Auth claims.';
            }
            else if (code === 'already-exists' || description.includes('already exists')) {
                description = 'A user with this email already exists. Try a different email.';
            }
            toast({
                title: 'Error',
                description,
                variant: 'destructive',
            });
        }
        finally {
            setIsLoading(false);
        }
    });
    const handleTabChange = (value) => {
        setActiveRole(value);
        form.setValue('role', value);
        // Reset form when role changes
        form.reset({
            email: form.getValues('email'),
            password: form.getValues('password'),
            name: form.getValues('name'),
            phone: form.getValues('phone'),
            role: value,
            status: 'active',
        });
    };
    useEffect(() => {
        // load kids for parent selection
        const loadKids = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const snap = yield getDocs(collection(db, 'kids'));
                setKids(snap.docs.map(d => (Object.assign({ id: d.id }, d.data()))));
            }
            catch (err) {
                console.error('Failed to load kids for parent selection', err);
            }
        });
        loadKids();
    }, []);
    return (_jsxs("div", { className: "space-y-4", children: [isAdminLocal === false && (_jsx("div", { className: "p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700", children: "Your account does not appear to have Admin permissions. You will not be able to create users." })), _jsxs(Tabs, { value: activeRole, onValueChange: handleTabChange, className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-5", children: [_jsx(TabsTrigger, { value: "admin", children: "Admin" }), _jsx(TabsTrigger, { value: "teacher", children: "Teacher" }), _jsx(TabsTrigger, { value: "parent", children: "Parent" }), _jsx(TabsTrigger, { value: "learningPartner", children: "LP" }), _jsx(TabsTrigger, { value: "kid", children: "Kid" })] }), _jsx(Form, Object.assign({}, form, { children: _jsxs("form", { onSubmit: form.handleSubmit(onSubmit), className: "space-y-4 mt-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "email", render: ({ field }) => (_jsxs(FormItem, { children: [_jsxs(FormLabel, { children: ["Email ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "user@example.com" }, field)) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "password", render: ({ field }) => (_jsxs(FormItem, { children: [_jsxs(FormLabel, { children: ["Password ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ type: "password", placeholder: "Enter password" }, field)) }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "name", render: ({ field }) => (_jsxs(FormItem, { children: [_jsxs(FormLabel, { children: ["Full Name ", _jsx("span", { className: "text-red-500", children: "*" })] }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "Full Name" }, field)) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "phone", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Phone" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "+1 (555) 123-4567" }, field)) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "status", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Status" }), _jsx(FormControl, { children: _jsxs(Select, { value: field.value, onValueChange: field.onChange, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "active", children: "Active" }), _jsx(SelectItem, { value: "suspended", children: "Suspended" }), _jsx(SelectItem, { value: "archived", children: "Archived" })] })] }) }), _jsx(FormMessage, {})] })) }), activeRole === 'teacher' && (_jsxs(TabsContent, { value: "teacher", className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "qualification", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Qualification" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "B.Ed, M.Ed" }, field)) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "specialization", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Specialization" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "Phonics, Grammar, Public Speaking" }, field)) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "yearsExperience", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Years of Experience" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ type: "number", placeholder: "5" }, field, { onChange: (e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined) })) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "bio", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Bio" }), _jsx(FormControl, { children: _jsx(Textarea, Object.assign({ placeholder: "Brief bio..." }, field)) }), _jsx(FormMessage, {})] })) })] })), activeRole === 'parent' && (_jsxs(TabsContent, { value: "parent", className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "address", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Address" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "Street address" }, field)) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsx(FormField, { control: form.control, name: "city", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "City" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "City" }, field)) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "state", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "State" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "State" }, field)) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "pincode", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Pincode" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "123456" }, field)) }), _jsx(FormMessage, {})] })) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "communicationLanguage", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Communication Language" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "English" }, field)) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "sessionTime", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Preferred Session Time" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "Morning, Evening" }, field)) }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: form.control, name: "paymentMethods", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Payment Methods" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "UPI, Bank Transfer, Credit Card" }, field)) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "childIds", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Assign kids (optional)" }), _jsx("div", { className: "mt-2", children: _jsx(KidMultiSelect, { value: field.value || [], onChange: (ids) => field.onChange(ids), kids: kids.map(k => ({ id: k.id, name: k.fullName || k.name || k.id })) }) }), _jsx(FormMessage, {})] })) })] })), activeRole === 'learningPartner' && (_jsxs(TabsContent, { value: "learningPartner", className: "space-y-4", children: [_jsx(FormField, { control: form.control, name: "region", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Region" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "Mumbai, Delhi" }, field)) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "bankAccountHolderName", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Bank Account Holder Name" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "Full Name" }, field)) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: form.control, name: "bankAccountNumber", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Bank Account Number" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "1234567890" }, field)) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: form.control, name: "bankIfscCode", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "IFSC Code" }), _jsx(FormControl, { children: _jsx(Input, Object.assign({ placeholder: "ABCD0123456" }, field)) }), _jsx(FormMessage, {})] })) })] })] })), activeRole === 'kid' && (_jsx(TabsContent, { value: "kid", className: "space-y-4", children: _jsx(FormField, { control: form.control, name: "isKidProfile", render: ({ field }) => (_jsxs(FormItem, { className: "flex flex-row items-center space-x-3 space-y-0", children: [_jsx(FormControl, { children: _jsx("input", { type: "checkbox", checked: field.value || false, onChange: field.onChange }) }), _jsx("div", { className: "space-y-1 leading-none", children: _jsx(FormLabel, { children: "Is Kid Profile" }) })] })) }) })), _jsxs("div", { className: "flex justify-end space-x-2 pt-4", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => {
                                                form.reset();
                                                setCreatedUserData(null);
                                                onClose === null || onClose === void 0 ? void 0 : onClose();
                                            }, children: "Cancel" }), _jsx(Button, { type: "submit", disabled: isLoading || isAdminLocal === false, children: isLoading ? 'Creating...' : 'Create User' })] })] }) }))] }), createdUserData && (_jsxs("div", { className: "mt-6 p-4 bg-green-50 border border-green-200 rounded-md", children: [_jsx("h3", { className: "text-lg font-semibold text-green-800 mb-2", children: "User Created Successfully!" }), _jsxs("div", { className: "space-y-2 text-sm", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-700", children: "User ID (UID):" }), _jsx("p", { className: "font-mono text-xs bg-gray-100 p-1 rounded mt-1", children: createdUserData.uid })] }), _jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-700", children: "Email:" }), _jsx("p", { className: "text-gray-900", children: createdUserData.email })] })] }), (createdUserData === null || createdUserData === void 0 ? void 0 : createdUserData.resetLink) && (_jsxs("div", { className: "mt-4", children: [_jsx("span", { className: "font-medium text-gray-700", children: "Password Reset Link" }), _jsx("p", { className: "text-xs mt-1 break-all", children: createdUserData.resetLink }), _jsx("div", { className: "mt-2", children: _jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => {
                                                try {
                                                    navigator.clipboard.writeText(createdUserData.resetLink);
                                                    toast({ title: 'Copied', description: 'Reset link copied to clipboard' });
                                                }
                                                catch (err) {
                                                    toast({ title: 'Copy failed', description: 'Could not copy reset link' });
                                                }
                                            }, children: "Copy Reset Link" }) })] })), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-700", children: "Created At:" }), _jsx("p", { className: "text-gray-900", children: createdUserData.createdAt ? new Date(createdUserData.createdAt).toLocaleString() : 'N/A' })] }), _jsxs("div", { children: [_jsx("span", { className: "font-medium text-gray-700", children: "Last Updated:" }), _jsx("p", { className: "text-gray-900", children: createdUserData.updatedAt ? new Date(createdUserData.updatedAt).toLocaleString() : 'N/A' })] })] }), _jsx("div", { className: "mt-4", children: _jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => setCreatedUserData(null), children: "Clear" }) })] })] }))] }));
}
