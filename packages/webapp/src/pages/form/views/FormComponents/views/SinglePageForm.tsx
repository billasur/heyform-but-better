import { FC, useEffect, useState } from 'react'
import { useStore } from '../hooks/useStore'
import { useTranslation } from 'react-i18next'
import { Form } from '../blocks/Form'
import { Field } from '../blocks/Field'
import { Welcome } from '../blocks/Welcome'
import { ThankYou } from '../blocks/ThankYou'
import { Branding } from '../blocks/Branding'
import { Header } from './Header'
import { Footer } from './Footer'
import { FirebaseFormService } from '@/firebase/formService'

export const SinglePageForm: FC = () => {
  const { state, dispatch } = useStore()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | undefined>()

  // Handle form submission
  async function handleSubmit(values: any) {
    if (loading) return
    
    setLoading(true)
    setSubmitError(undefined)
    
    try {
      // Validate all fields
      state.fields.forEach(field => {
        // Add validation logic here
      })
      
      // Submit to Firebase
      if (state.onSubmit) {
        await state.onSubmit(values, false, state.stripe)
      } else {
        await FirebaseFormService.submitForm(state.formId, values)
      }
      
      // Mark as submitted
      dispatch({
        type: 'setIsSubmitted',
        payload: {
          isSubmitted: true
        }
      })
      
    } catch (err: any) {
      console.error(err)
      setSubmitError(err?.message || 'Failed to submit form')
    } finally {
      setLoading(false)
    }
  }

  // If not started and has welcome field
  if (!state.isStarted && state.welcomeField) {
    return <Welcome field={state.welcomeField} />
  }

  // If form is submitted
  if (state.isSubmitted) {
    const field: any = state.thankYouField || {
      title: t('Thank you!'),
      description: t('Thanks for completing this form. Now create your own form.'),
      properties: {
        buttonText: t('Create a heyform')
      }
    }

    return <ThankYou field={field} />
  }

  return (
    <div className="heyform-single-page">
      <Header />
      
      <div className="heyform-single-page-content">
        <Form onFinish={handleSubmit} loading={loading} submitError={submitError}>
          {state.fields.map((field, index) => (
            <div key={field.id} className="heyform-single-page-field">
              <h3 className="heyform-single-page-field-number">
                {t('Question {{number}}', { number: index + 1 })}
              </h3>
              <Field field={field} />
            </div>
          ))}
        </Form>
      </div>
      
      <Footer />
      <Branding />
    </div>
  )
} 