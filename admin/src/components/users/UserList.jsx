import { motion } from "framer-motion";
import UserCard from "./UserCard";
import { LoadingSpinner } from "../../shared/components";
import { UsersIcon } from "@heroicons/react/24/outline";

const UserList = ({ users, loading, onUserSelect, onEditUser }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" ariaLabel="Loading users" />
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="text-center py-20">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6"
        >
          <UsersIcon className="w-10 h-10 text-gray-400" />
        </motion.div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          No users found
        </h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Try adjusting your search or filter criteria to find what you're looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 sm:space-y-4">
      {users.map((user, index) => (
        <motion.div
          key={user._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
        >
          <UserCard
            user={user}
            onSelect={() => onUserSelect(user)}
            onEdit={() => onEditUser(user)}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default UserList;
