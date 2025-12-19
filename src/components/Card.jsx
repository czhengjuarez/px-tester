import { clsx } from 'clsx'

const Card = ({ 
  children, 
  icon, 
  title, 
  description, 
  className = '',
  ...props 
}) => {
  return (
    <div
      className={clsx(
        'bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-slate-700/50',
        'hover:shadow-2xl hover:border-purple-500/50 transition-all duration-300',
        'hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="text-purple-400 mb-4 flex justify-center">
          {icon}
        </div>
      )}
      {title && (
        <h3 className="text-xl font-semibold text-white mb-2">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-gray-400">
          {description}
        </p>
      )}
      {!title && !description && children}
    </div>
  )
}

export default Card
