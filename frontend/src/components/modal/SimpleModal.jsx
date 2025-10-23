import PropTypes from "prop-types";

export default function SimpleModal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
          {title && <h3 className="text-xl font-bold mb-3">{title}</h3>}
          <div>{children}</div>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose}
              className="px-4 py-2 rounded-lg border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
SimpleModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  title: PropTypes.string,
  children: PropTypes.node
};
