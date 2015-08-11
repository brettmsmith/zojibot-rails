class User < ActiveRecord::Base
    has_many :commands
end
