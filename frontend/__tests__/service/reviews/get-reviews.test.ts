/**
 * @jest-environment node
 */

import { env } from '@/env.mjs'
import { serverFetcher } from '@/lib/server-fetcher'
import { setSpotifyClientAccessToken, spotifyClient } from '@/lib/spotify'
import { generateSpotifySingleAlbumResponseForTest } from '@/lib/testutil/albums'
import { generateApiReviewForTest } from '@/lib/testutil/reviews'
import { toReview } from '@/lib/transform/review'
import { getReview } from '@/service/reviews/get-review'
import { ApiErrorType } from '@/types/api/error'
import { EntityNotFoundError } from '@/types/error'

jest.mock('@/lib/server-fetcher', () => ({
  serverFetcher: jest.fn(),
}))

jest.mock('@/lib/spotify', () => {
  return {
    setSpotifyClientAccessToken: jest.fn(),
    spotifyClient: {
      getAlbum: jest.fn(),
    },
  }
})

jest.mock('@/env.mjs', () => ({
  env: {
    API_URL: 'http://example.com/api',
  },
}))

describe('getReview', () => {
  const mockServerFetcher = serverFetcher as jest.Mock
  const mockSetSpotifyClientAccessToken =
    setSpotifyClientAccessToken as jest.Mock
  const mockgetAlbum = spotifyClient.getAlbum as jest.Mock

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('レビューが存在する場合はレビューデータを返す', async () => {
    const validReviewId = 'b4606453-f786-42ae-a073-2d7afe9c94c5'

    const mockAlbumData = generateSpotifySingleAlbumResponseForTest()

    const mockReviewData = generateApiReviewForTest({
      review_id: validReviewId,
      album_id: mockAlbumData.id,
    })

    mockServerFetcher.mockResolvedValueOnce(mockReviewData)
    mockgetAlbum.mockResolvedValueOnce({ body: mockAlbumData })
    mockSetSpotifyClientAccessToken.mockResolvedValueOnce({})

    const review = await getReview(validReviewId)

    expect(mockServerFetcher).toHaveBeenCalledWith(
      `${env.API_URL}/reviews/${validReviewId}`,
      { cache: 'no-store' },
    )
    expect(mockgetAlbum).toHaveBeenCalledWith(mockReviewData.album_id)

    const expected = toReview(mockReviewData, mockAlbumData)
    expect(review).toEqual(expected)
  })

  it('レビューが存在しない場合はエラーを返す', async () => {
    const mockEntityNotFoundErrorData = {
      message: 'Entity not found',
      type: ApiErrorType.EntityNotFound,
    }
    mockServerFetcher.mockResolvedValueOnce(mockEntityNotFoundErrorData)

    const invalidReviewId = 'invalidReviewId'

    await expect(getReview(invalidReviewId)).rejects.toThrow(
      EntityNotFoundError,
    )

    expect(mockServerFetcher).toHaveBeenCalledWith(
      `${env.API_URL}/reviews/${invalidReviewId}`,
      { cache: 'no-store' },
    )
    expect(mockgetAlbum).not.toHaveBeenCalled()
  })

  it('レビュー対象のアルバムが存在しない場合はエラーを返す', async () => {
    const validReviewId = 'b4606453-f786-42ae-a073-2d7afe9c94c5'

    const mockReviewData = generateApiReviewForTest({
      review_id: validReviewId,
    })

    mockServerFetcher.mockResolvedValueOnce(mockReviewData)

    const mockSpotifyResourceNotFoundErrorData = {
      body: {
        error: { status: 404, message: 'Album not found' },
      },
      headers: {},
      statusCode: 404,
    }

    mockgetAlbum.mockRejectedValueOnce(
      new Error(JSON.stringify(mockSpotifyResourceNotFoundErrorData)),
    )

    // await expect(getReview(validReviewId)).rejects.toThrow(
    //   SpotifyResourceNotFoundError,
    // )

    await expect(getReview(validReviewId)).rejects.toThrow()

    expect(mockServerFetcher).toHaveBeenCalledWith(
      `${env.API_URL}/reviews/${validReviewId}`,
      { cache: 'no-store' },
    )
    expect(mockgetAlbum).toHaveBeenCalledWith(mockReviewData.album_id)
  })

  // it('その他のエラーレスポンスの場合はエラータイプとエラーメッセージを含むエラーを返す', async () => {
  //   const mockOtherErrorData = {
  //     message: 'Other error',
  //     type: ApiErrorType.Unauthorized,
  //   }
  //   mockServerFetcher.mockResolvedValue(mockOtherErrorData)

  //   await expect(getReview('otherError')).rejects.toThrow(
  //     `APIリクエスト中にエラーが発生しました: ${mockOtherErrorData.type} ,${mockOtherErrorData.message}`,
  //   )
  // })

  // it('エラーレスポンスの形式が不正な場合はエラーを返す', async () => {
  //   const mockInvalidErrorData = {
  //     message: 'Invalid error response',
  //   }
  //   mockServerFetcher.mockResolvedValue(mockInvalidErrorData)

  //   await expect(getReview('invalidError')).rejects.toThrow(
  //     'エラーレスポンスの形式が不正です',
  //   )
  // })
})
