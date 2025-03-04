import { useCallback, useEffect, useState } from 'react'

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

const DEBUG_LOCAL_STORAGE = false

const useLocalStorage = <T,>(key: string, initialValue: T) => {
  const [storedValue, _setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      if (DEBUG_LOCAL_STORAGE) {
        console.log('useLocalStorage: not operating in a browser')
      }

      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      let maybeParsed

      if (item) {
        maybeParsed = JSON.parse(item)
      } else {
        if (DEBUG_LOCAL_STORAGE) {
          console.log(
            'useLocalStorage - cannot parse from local storage:',
            item,
          )
        }

        maybeParsed = initialValue
      }

      return maybeParsed
    } catch (error) {
      console.log(error)
      return initialValue
    }
  })

  const setStoredValue = useCallback(
    (value: T) => {
      if (DEBUG_LOCAL_STORAGE) {
        console.log('useLocalStorage - setting stored value:', value)
      }
      _setStoredValue(value)
    },
    [_setStoredValue],
  )

  const setValue = useCallback(
    (value: T): void => {
      try {
        setStoredValue(value)

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(value))
        }
      } catch (error) {
        console.log(error)
      }
    },
    [key, setStoredValue],
  )

  return [storedValue, setValue] as const
}

export { useDebounce, useLocalStorage }
