import { setForkName, getForkName } from './utils/repository'

function popupWindow(url, title, window, w, h) {
  const y = window.top.outerHeight / 2 + window.top.screenY - h / 2
  const x = window.top.outerWidth / 2 + window.top.screenX - w / 2
  return window.open(
    url,
    title,
    'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=' +
      w +
      ', height=' +
      h +
      ', top=' +
      y +
      ', left=' +
      x
  )
}

async function handleForkCreated(forkName) {
  setForkName(forkName)
  fetch(`/api/preview`).then(() => {
    window.location.href = window.location.pathname
  })
}

export const enterEditMode = (
  githubAuthenticated: boolean,
  forkValid: boolean
) => {
  let authTab

  const authState = Math.random()
    .toString(36)
    .substring(7)

  const fork = getForkName()

  localStorage.setItem('fork_full_name', '')
  if (githubAuthenticated) {
    if (fork && forkValid) {
      handleForkCreated(fork)
      return
    } else {
      authTab = popupWindow(
        `/github/fork?state=${authState}`,
        '_blank',
        window,
        1000,
        700
      )
    }
  } else {
    authTab = popupWindow(
      `/github/start-auth?state=${authState}`,
      '_blank',
      window,
      1000,
      700
    )
  }
}

export const exitEditMode = () => {
  fetch(`/api/reset-preview`).then(() => {
    window.location.reload()
  })
}
