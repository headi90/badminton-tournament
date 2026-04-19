import { Link } from 'react-router-dom'
import { useLang } from '../lib/i18n'

export default function WelcomePage() {
  const { t } = useLang()
  return (
    <div className="max-w-2xl mx-auto py-16 px-4 text-center">
      <div className="text-6xl mb-6">🏸</div>
      <h1 className="text-4xl font-bold text-gray-800 mb-4">{t('welcome_title')}</h1>
      <p className="text-gray-500 text-lg mb-10">{t('welcome_subtitle')}</p>

      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/tournaments"
          className="bg-white border rounded-xl p-5 text-left shadow-sm hover:border-green-500 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-2">🏆</div>
          <h2 className="font-semibold text-gray-800 mb-1">{t('welcome_tournaments_title')}</h2>
          <p className="text-sm text-gray-500">{t('welcome_tournaments_desc')}</p>
        </Link>
        <Link
          to="/players"
          className="bg-white border rounded-xl p-5 text-left shadow-sm hover:border-green-500 hover:shadow-md transition-all"
        >
          <div className="text-2xl mb-2">👤</div>
          <h2 className="font-semibold text-gray-800 mb-1">{t('welcome_players_title')}</h2>
          <p className="text-sm text-gray-500">{t('welcome_players_desc')}</p>
        </Link>
      </div>
    </div>
  )
}
