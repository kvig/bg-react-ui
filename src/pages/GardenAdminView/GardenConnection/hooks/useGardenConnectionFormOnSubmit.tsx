import { AxiosRequestConfig } from 'axios'
import useAxios from 'axios-hooks'
import { FormikHelpers } from 'formik'
import { Dispatch, SetStateAction } from 'react'
import { Garden } from '../../garden-admin-view-types'
import {
  ConnectionFormFields,
  StompHeader,
} from '../form-components/ConnectionFormFields'
import { SubmissionStatusState } from '../GardenConnectionForm'

/**
 * Return a function to use as the onSubmit for Formik
 * @param garden
 * @param  setSubmissionStatus
 * @returns An onSubmit function
 */
const useGardenConnectionFormOnSubmit = (
  garden: Garden,
  setSubmissionStatus: Dispatch<
    SetStateAction<SubmissionStatusState | undefined>
  >,
) => {
  const axiosConfig: AxiosRequestConfig = {
    url: '/api/v1/gardens/' + encodeURIComponent(garden.name),
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  }
  const axiosOptions = {
    manual: true,
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [response, execute] = useAxios(axiosConfig, axiosOptions)
  return (
    connectionParams: ConnectionFormFields,
    formikActions: FormikHelpers<ConnectionFormFields>,
  ) => {
    const patchData = {
      operation: 'config',
      path: '',
      value: updateConnection(connectionParams, garden),
    }

    execute({
      data: patchData,
    })
      .then(() => setSubmissionStatus({ result: 'success' }))
      .catch((error) => {
        setSubmissionStatus({
          result: 'failure',
          msg: `${error.response.status} ${error.response.statusText}`,
        })
        console.log('ERROR', error)
      })

    formikActions.setSubmitting(false)
  }
}

export default useGardenConnectionFormOnSubmit

/**
 * Update a garden with new connection parameters.
 * @param connectionParams
 * @param garden
 * @returns Updated garden
 */
const updateConnection = (
  connectionParams: ConnectionFormFields,
  garden: Garden,
) => {
  const { connectionType, ...params } = connectionParams

  return {
    ...garden,
    connection_type: connectionType,
    connection_params: getConnectionParams(params),
  }
}

/**
 * Translate Formik form's data into connection parameters for beergarden
 * @param methodParams
 * @returns Connection parameters for beergarden
 */
const getConnectionParams = (
  methodParams: Omit<ConnectionFormFields, 'connectionType'>,
) => {
  return {
    http: {
      host: methodParams.httpHost,
      port: methodParams.httpPort,
      ca_verify: methodParams.httpCAVerify,
      ssl: methodParams.httpSsl,
      url_prefix: methodParams.httpUrlPrefix,
      ca_cert: methodParams.httpCACert,
      client_cert: methodParams.httpClientCert,
      username: methodParams.httpUsername,
      password: methodParams.httpPassword,
    },
    stomp: {
      host: methodParams.stompHost,
      port: methodParams.stompPort,
      send_destination: methodParams.stompSendDestination,
      subscribe_destination: methodParams.stompSubscribeDestination,
      username: methodParams.stompUsername,
      password: methodParams.stompPassword,
      ssl: { use_ssl: methodParams.stompSsl },
      headers: (methodParams.stompHeaders as StompHeader[]).map(deIdifyHeader),
    },
  }
}

/**
 * Strip the id field from a stomp header
 * @param param0
 * @returns Stripped stomp header
 */
const deIdifyHeader = ({
  key,
  value,
}: StompHeader): Omit<StompHeader, 'id'> => ({
  key: key,
  value: value,
})
