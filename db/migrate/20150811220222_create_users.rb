class CreateUsers < ActiveRecord::Migration
  def change
    create_table :users do |t|
        t.string :username
        t.integer :pid
        t.string :token
        t.references :command
        t.string :bottoken
      t.timestamps null: false
    end
  end
end
