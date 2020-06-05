import { b64EncodeUnicode } from './base64'
import GithubError from '../../../open-authoring/github/api/GithubError'

export class GithubApi {
  proxy: string
  baseRepoFullName: string
  constructor(proxy: string, baseRepoFullName: string) {
    this.proxy = proxy
    this.baseRepoFullName = baseRepoFullName
  }

  async getUser() {
    try {
      const data = await this.req({
        url: `https://api.github.com/user`,
        method: 'GET',
      })

      return data
    } catch (e) {
      if ((e.status = 401)) {
        return
      }
      throw e
    }
  }

  createFork() {
    return this.req({
      url: `https://api.github.com/repos/${process.env.REPO_FULL_NAME}/forks`,
      method: 'POST',
    })
  }

  createPR(forkRepoFullName, headBranch, title, body) {
    return this.req({
      url: `https://api.github.com/repos/${this.baseRepoFullName}/pulls`,
      method: 'POST',
      data: {
        title: title ? title : 'Update from TinaCMS',
        body: body ? body : 'Please pull these awesome changes in!',
        head: `${forkRepoFullName.split('/')[0]}:${headBranch}`,
        base: process.env.BASE_BRANCH,
      },
    })
  }

  async fetchExistingPR(forkRepoFullName, headBranch) {
    const branches = await this.req({
      url: `https://api.github.com/repos/${this.baseRepoFullName}/pulls`,
      method: 'GET',
    })

    for (var i = 0; i < branches.length; i++) {
      const pull = branches[i]
      if (headBranch === pull.head.ref) {
        if (
          pull.head.repo?.full_name === forkRepoFullName &&
          pull.base.repo?.full_name === this.baseRepoFullName
        ) {
          return pull // found matching PR
        }
      }
    }

    return
  }

  async getBranch(repoFullName: string, branch: string) {
    try {
      const data = await this.req({
        url: `https://api.github.com/repos/${repoFullName}/git/ref/heads/${branch}`,
        method: 'GET',
      })
      return data
    } catch (e) {
      if ((e.status = 404)) {
        return
      }
      throw e
    }

    // TODO
    // if (data.ref.startsWith('refs/heads/')) {
    //   //check if branch, and not tag
    //   return data
    // }
    // return // Bubble up error here?
  }

  async save(
    repo: string,
    branch: string,
    filePath: string,
    sha: string,
    formData: string,
    message: string = 'Update from TinaCMS'
  ) {
    return this.req({
      url: `https://api.github.com/repos/${repo}/contents/${filePath}`,
      method: 'PUT',
      data: {
        message,
        content: b64EncodeUnicode(formData),
        sha,
        branch: branch,
      },
    })
  }

  private async req(data) {
    const response = await this.proxyRequest(data)
    return this.getGithubResponse(response)
  }

  private async getGithubResponse(response: Response) {
    const data = await response.json()
    //2xx status codes
    if (response.status.toString()[0] == '2') return data

    throw new GithubError(response.statusText, response.status)
  }

  private proxyRequest(data) {
    return fetch(this.proxy, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }
}
