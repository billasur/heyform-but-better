import { validateFields } from '@heyform-inc/answer-utils'
import type { FormField } from '@heyform-inc/shared-types-enums'
import { FieldKindEnum, NumberPrice } from '@heyform-inc/shared-types-enums'
import { helper } from '@heyform-inc/utils'
import { IconChevronRight } from '@tabler/icons-react'
import Big from 'big.js'
import clsx from 'clsx'
import type { FormProps as RCFormProps } from 'rc-field-form'
import RCForm, { Field, useForm } from 'rc-field-form'
import type { FC, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'

import { useKey } from '@/utils'

import { Submit } from '../components'
import { removeStorage, useStore } from '../store'
import {
  sendHideModalMessage,
  sliceFieldsByLogics,
  useTranslation,
  validateLogicField
} from '../utils'

interface FormProps extends RCFormProps {
  field: FormField
  autoSubmit?: boolean
  isSubmitShow?: boolean
  submitButtonText?: string
  hideSubmitIfErrorOccurred?: boolean
  getValues?: (values: any) => any
  children?: ReactNode
}

const NextIcon = <IconChevronRight />

export const Form: FC<FormProps> = ({
  field,
  autoSubmit: rawAutoSubmit = false,
  isSubmitShow: rawSubmitShow = true,
  submitButtonText = 'Submit',
  validateTrigger: trigger,
  hideSubmitIfErrorOccurred = false,
  getValues,
  children,
  ...restProps
}) => {
  const [form] = useForm<any>()
  const { t } = useTranslation()
  const { state, dispatch } = useStore()
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string>()

  const fieldError = useMemo(
    () => (state.errorFieldId === field.id ? state.errorFieldMessage : undefined),
    [field.id, state.errorFieldId, state.errorFieldMessage]
  )

  const autoSubmit = useMemo(
    () => (state.alwaysShowNextButton ? false : rawAutoSubmit),
    [rawAutoSubmit, state.alwaysShowNextButton]
  )

  const validateTrigger = trigger ? trigger : autoSubmit ? 'onChange' : 'onSubmit'
  const isLastBlock = useMemo(
    () => state.scrollIndex! >= state.fields.length - 1,
    [state.fields.length, state.scrollIndex]
  )

  const initialValues = getValues ? getValues(restProps.initialValues) : restProps.initialValues
  const isSubmitShow = useMemo(
    () => rawSubmitShow || state.alwaysShowNextButton,
    [rawSubmitShow, state.alwaysShowNextButton]
  )
  const submitVisible = useMemo(
    () =>
      hideSubmitIfErrorOccurred && !isSubmitShow
        ? false
        : helper.isValid(initialValues) || isSubmitShow,
    [initialValues, isSubmitShow, hideSubmitIfErrorOccurred]
  )

  const isSkipable = useMemo(() => {
    return !field.validations?.required && field.kind !== 'statement' && field.kind !== 'group'
  }, [])

  const handleFinish = async (values: any) => {
    try {
      setLoading(true)
      setSubmitError('')

      // For single page form, we collect all values at once
      await state.onSubmit?.(values, false, state.stripe)
      
      dispatch({
        type: 'setSubmitted',
        payload: {
          isSubmitted: true
        }
      })
    } catch (err: any) {
      setSubmitError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleValuesChange(changes: any, values: any) {
    restProps.onValuesChange?.(changes, values)

    if (autoSubmit) {
      if (isLastBlock) {
        const value = getValues ? getValues(changes) : changes

        if (helper.isValid(value)) {
          dispatch({
            type: 'setValues',
            payload: {
              values: {
                [field.id]: value
              }
            }
          })
        }
      } else {
        setTimeout(() => form.submit(), 500)
      }

      return
    }

    // Rc-field-form doesn't provide any way to clear errors,
    // so it can only be done in the following disgraceful way.
    // see https://github.com/ant-design/ant-design/issues/24599#issuecomment-653292811
    Object.keys(values).forEach(name => {
      const error = form.getFieldError(name)

      if (error.length > 0) {
        form.setFields([
          {
            name,
            errors: []
          }
        ])
      }
    })
  }

  function handleSkip() {
    dispatch({ type: 'scrollNext' })
  }

  useKey('Enter', (event: KeyboardEvent) => {
    if (window.heyform.device.mobile) {
      return event.preventDefault()
    }

    form.submit()
  })

  useEffect(() => {
    if (field.id === state.errorFieldId) {
      form.validateFields()
    }
  }, [state.errorFieldId])

  return (
    <RCForm
      className={clsx('heyform-form', {
        'heyform-form-single-page': true
      })}
      autoComplete="off"
      form={form}
      validateTrigger={validateTrigger}
      onValuesChange={handleValuesChange}
      onFinish={handleFinish}
      {...restProps}
    >
      {children}

      {/* Field validation error */}
      {fieldError && (
        <div className="heyform-validation-wrapper">
          <div className="heyform-validation-error">{fieldError}</div>
        </div>
      )}

      {/* Submit */}
      <>
        {submitError && (
          <div className="heyform-validation-wrapper">
            <div className="heyform-validation-error">{submitError}</div>
          </div>
        )}
        <Field shouldUpdate={true}>
          <Submit text={t('Submit')} loading={loading} />
        </Field>
        <div className="heyform-submit-warn">
          {t('Never submit passwords!')} -{' '}
          <a
            href={state.reportAbuseURL || 'https://docs.heyform.net/report-abuse'}
            target="_blank"
          >
            {t('Report Abuse')}
          </a>
        </div>
      </>
    </RCForm>
  )
}
