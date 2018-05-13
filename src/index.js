import cu from 'auto-curry'

export const observeElementInViewport = cu(
  (opts, el, inHandler, outHandler) => {
    const defaultOptions = {
      // null for window, otherwise give css selector.
      // el to be observed should be a child of element given by this selector
      viewport: null,

      // accepts px and %
      modTop: '0px',
      modRight: '0px',
      modBottom: '0px',
      modLeft: '0px',

      // percentage of el that should intersect with viewport to consinder it "in viewport"
      // 0 means on the 1st pixel intersection or exit, the respective handler will be called
      threshold: [0]
    }

    const {
      viewport,
      modTop,
      modLeft,
      modBottom,
      modRight,
      threshold
    } = Object.assign({}, defaultOptions, opts)

    if (!Array.isArray(threshold) && !(typeof threshold === 'number')) {
      throw new Error('threshold should be a number or an array of numbers')
    }

    const intersectionObserverOptions = {
      root: viewport instanceof Node ? viewport : null,
      rootMargin: `${modTop} ${modRight} ${modBottom} ${modLeft}`,
      // threshold is always an array with 0 as the first element
      // so that isIntersecting is caught at lease once as it
      // is reported by the entry only for threshold 0
      // ¯\_(ツ)_/¯
      // The mod 101 is to prevent threshold from being greater than 1
      threshold: defaultOptions.threshold.concat(
        Array.isArray(threshold)
          ? threshold.map(t => Math.floor(t % 101) / 100)
          : [Math.floor(threshold % 101) / 100]
      )
    }

    const isDebugEnabled =
          localStorage.debug &&
          localStorage.debug.includes('observeElementInViewport')

    if (isDebugEnabled) {
      console.log('IntersectionObserver options', intersectionObserverOptions)
    }

    const cb = (entries, observer) => {
      const entryForEl = entries.filter(entry => entry.target === el)[0]
      const unobserve = _ => observer.unobserve(el)

      if (entryForEl) {
        const { isIntersecting } = entryForEl

        if (isIntersecting) {
          inHandler(entryForEl, unobserve)
        } else {
          outHandler(entryForEl, unobserve)
        }
      }
    }

    const observer = new IntersectionObserver(cb, intersectionObserverOptions)

    observer.observe(el)

    return _ => observer.unobserve(el)
  }
)

export const isInViewport = cu(async (opts, el) => {
  return new Promise((resolve, reject) => {
    try {
      observeElementInViewport(
        opts,
        el,
        (_, unobserve) => {
          unobserve()
          resolve(true)
        },
        (_, unobserve) => {
          unobserve()
          resolve(false)
        }
      )
    } catch (e) {
      reject(e)
    }
  })
})
