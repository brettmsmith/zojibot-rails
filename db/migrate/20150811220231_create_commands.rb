class CreateCommands < ActiveRecord::Migration
  def change
    create_table :commands do |t|
        t.string :call
        t.string :response
        t.integer :userlevel
        t.string :username
      t.timestamps null: false
    end
  end
end
