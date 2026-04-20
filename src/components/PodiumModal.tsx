import { useLang } from '../lib/i18n'

interface Props {
  tournamentName: string
  podium: { place: number; name: string }[]
  onClose: () => void
}

const medals = ['🥇', '🥈', '🥉']
const placeKeys = ['podium_1st', 'podium_2nd', 'podium_3rd'] as const

export default function PodiumModal({ tournamentName, podium, onClose }: Props) {
  const { t } = useLang()
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 text-center">
        <div className="text-5xl mb-3">🏆</div>
        <h2 className="text-xl font-bold text-gray-800 mb-1">{t('podium_title')}</h2>
        <p className="text-sm text-gray-500 mb-6">{tournamentName}</p>

        <div className="space-y-3 mb-8">
          {podium.map(({ place, name }) => (
            <div key={place} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <span className="text-2xl">{medals[place - 1]}</span>
              <div className="text-left">
                <p className="text-xs text-gray-400">{t(placeKeys[place - 1])}</p>
                <p className="font-semibold text-gray-800">{name}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-gray-500 mb-6">{t('podium_congrats')}</p>

        <button
          onClick={onClose}
          className="w-full bg-green-600 text-white rounded-lg py-2.5 font-medium hover:bg-green-700"
        >
          {t('podium_close')}
        </button>
      </div>
    </div>
  )
}
