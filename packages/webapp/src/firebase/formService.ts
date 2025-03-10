import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, deleteDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from './config'
import { FormModel } from '@heyform-inc/shared-types-enums'
import { v4 as uuidv4 } from 'uuid'

const FORMS_COLLECTION = 'forms'
const SUBMISSIONS_COLLECTION = 'submissions'

export const FirebaseFormService = {
  // Create a new form
  async createForm(form: Partial<FormModel>): Promise<string> {
    const formId = form.id || uuidv4()
    await setDoc(doc(db, FORMS_COLLECTION, formId), {
      ...form,
      id: formId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
    return formId
  },

  // Get a form by ID
  async getForm(formId: string): Promise<FormModel | null> {
    const docRef = doc(db, FORMS_COLLECTION, formId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      return docSnap.data() as FormModel
    }
    return null
  },

  // Update a form
  async updateForm(formId: string, updates: Partial<FormModel>): Promise<void> {
    const docRef = doc(db, FORMS_COLLECTION, formId)
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    })
  },

  // Delete a form
  async deleteForm(formId: string): Promise<void> {
    await deleteDoc(doc(db, FORMS_COLLECTION, formId))
  },

  // Get forms by project ID
  async getFormsByProject(projectId: string): Promise<FormModel[]> {
    const q = query(collection(db, FORMS_COLLECTION), where("projectId", "==", projectId))
    const querySnapshot = await getDocs(q)
    
    const forms: FormModel[] = []
    querySnapshot.forEach((doc) => {
      forms.push(doc.data() as FormModel)
    })
    
    return forms
  },

  // Submit form responses
  async submitForm(formId: string, answers: any): Promise<string> {
    const submissionId = uuidv4()
    await setDoc(doc(db, SUBMISSIONS_COLLECTION, submissionId), {
      id: submissionId,
      formId,
      answers,
      createdAt: new Date().toISOString()
    })
    return submissionId
  },

  // Upload file
  async uploadFile(formId: string, file: File): Promise<string> {
    const fileRef = ref(storage, `forms/${formId}/files/${file.name}-${Date.now()}`)
    await uploadBytes(fileRef, file)
    return getDownloadURL(fileRef)
  },

  // Get submissions for a form
  async getSubmissions(formId: string): Promise<any[]> {
    const q = query(collection(db, SUBMISSIONS_COLLECTION), where("formId", "==", formId))
    const querySnapshot = await getDocs(q)
    
    const submissions: any[] = []
    querySnapshot.forEach((doc) => {
      submissions.push(doc.data())
    })
    
    return submissions
  }
} 