import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config';
import { FormModel } from '@heyform-inc/shared-types-enums';

// Collection references
const formsCollection = collection(db, 'forms');
const submissionsCollection = collection(db, 'submissions');

export const FormService = {
  // Create a new form
  async create(form: any): Promise<string> {
    const docRef = await addDoc(formsCollection, {
      ...form,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  },

  // Get all forms for a project
  async forms(projectId: string): Promise<any[]> {
    const q = query(formsCollection, where("projectId", "==", projectId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },

  // Get a form by ID
  async form(formId: string): Promise<any> {
    const docRef = doc(formsCollection, formId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error("Form not found");
    }
  },

  // Get a public form
  async publicForm(formId: string): Promise<FormModel> {
    return this.form(formId);
  },

  // Update a form
  async update(formId: string, data: any): Promise<void> {
    const docRef = doc(formsCollection, formId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: new Date()
    });
  },

  // Delete a form
  async delete(formId: string): Promise<void> {
    await deleteDoc(doc(formsCollection, formId));
  },

  // Submit a form
  async completeSubmission(data: any): Promise<any> {
    const { formId, answers, hiddenFields, openToken, passwordToken, partialSubmission } = data;
    
    const submission = {
      formId,
      answers,
      hiddenFields,
      openToken,
      passwordToken,
      partialSubmission,
      createdAt: new Date()
    };
    
    const docRef = await addDoc(submissionsCollection, submission);
    return { id: docRef.id };
  },

  // Upload file
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  },

  // Open a form (track form opening)
  async openForm(formId: string): Promise<string> {
    // Generate a token for tracking form opening
    return `open_${formId}_${Date.now()}`;
  }
}; 